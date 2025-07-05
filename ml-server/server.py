# ================================
# 📌 Imports
# ================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import xgboost as xgb
import joblib
from scipy.sparse import hstack
import numpy as np
import logging
import sys
from datetime import datetime
import os
from pathlib import Path
from contextlib import asynccontextmanager
import warnings

# Suppress sklearn warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ================================
# 📌 Logging Configuration
# ================================
def setup_logging():
    """Configure logging with both file and console handlers"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging format (removed emojis for Windows compatibility)
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Create logger
    logger = logging.getLogger("youtube_predictor")
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Console handler with UTF-8 encoding
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(log_format)
    console_handler.setFormatter(console_formatter)
    
    # File handler with UTF-8 encoding
    log_file = log_dir / f"api_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(log_format)
    file_handler.setFormatter(file_formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Initialize logging
logger = setup_logging()

# ================================
# 📌 Load Model and Vectorizers
# ================================
def load_model_components():
    """Load model and vectorizers with error handling"""
    try:
        logger.info("Loading model and vectorizers...")
        
        # Load XGBoost model
        model = xgb.Booster()
        model.load_model("xgb_model.json")
        logger.info("[SUCCESS] XGBoost model loaded successfully")
        
        # Load vectorizers
        vectorizer_title = joblib.load("vectorizer_title.pkl")
        vectorizer_desc = joblib.load("vectorizer_desc.pkl")
        vectorizer_tags = joblib.load("vectorizer_tags.pkl")
        logger.info("[SUCCESS] All vectorizers loaded successfully")
        
        return model, vectorizer_title, vectorizer_desc, vectorizer_tags
        
    except Exception as e:
        logger.error(f"[ERROR] Error loading model components: {str(e)}")
        raise

# Global variables for model components
model = None
vectorizer_title = None
vectorizer_desc = None
vectorizer_tags = None

# ================================
# 📌 Lifespan Events
# ================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("[STARTUP] YouTube Views Predictor API is starting up...")
    global model, vectorizer_title, vectorizer_desc, vectorizer_tags
    model, vectorizer_title, vectorizer_desc, vectorizer_tags = load_model_components()
    logger.info("[STARTUP] API Documentation available at: /docs")
    logger.info("[STARTUP] Alternative documentation at: /redoc")
    logger.info("[STARTUP] Health check available at: /health")
    
    yield
    
    # Shutdown
    logger.info("[SHUTDOWN] YouTube Views Predictor API is shutting down...")

# ================================
# 📌 FastAPI app initialization
# ================================
app = FastAPI(
    title="YouTube Views Predictor API",
    description="A machine learning API to predict YouTube video views based on title, description, and tags",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# 📌 Input Schema
# ================================
class VideoInput(BaseModel):
    title: str = Field(
        ..., 
        description="The title of the YouTube video",
        examples=["How to Build a Machine Learning API with FastAPI"]
    )
    description: str = Field(
        ..., 
        description="The description of the YouTube video",
        examples=["In this tutorial, we'll learn how to create a REST API using FastAPI and deploy a machine learning model for predictions."]
    )
    tags_cleaned: str = Field(
        ..., 
        description="Cleaned tags for the video (space-separated)",
        examples=["fastapi machine learning python api tutorial"]
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "How to Build a Machine Learning API with FastAPI",
                "description": "In this tutorial, we'll learn how to create a REST API using FastAPI and deploy a machine learning model for predictions.",
                "tags_cleaned": "fastapi machine learning python api tutorial"
            }
        }
    }

class PredictionResponse(BaseModel):
    predicted_views: int = Field(
        ..., 
        description="Predicted number of views for the video"
    )
    confidence: str = Field(
        ..., 
        description="Confidence level of the prediction"
    )
    processed_at: str = Field(
        ..., 
        description="Timestamp when the prediction was made"
    )

# ================================
# 📌 Prediction Endpoint
# ================================
@app.post("/predict", response_model=PredictionResponse)
async def predict_views(video: VideoInput):
    """
    Predict YouTube video views based on title, description, and tags.
    
    - **title**: The video title
    - **description**: The video description
    - **tags_cleaned**: Space-separated cleaned tags
    
    Returns the predicted number of views.
    """
    try:
        start_time = datetime.now()
        logger.info(f"[PREDICT] Prediction request received for title: '{video.title[:50]}...'")
        
        # Vectorize inputs
        logger.info("[PREDICT] Vectorizing input features...")
        X_title = vectorizer_title.transform([video.title])
        X_desc = vectorizer_desc.transform([video.description])
        X_tags = vectorizer_tags.transform([video.tags_cleaned])
        
        # Combine features
        X_combined = hstack([X_title, X_desc, X_tags])
        logger.info(f"[PREDICT] Combined feature matrix shape: {X_combined.shape}")
        
        # Convert to DMatrix
        dmatrix = xgb.DMatrix(X_combined)
        
        # Predict log views and convert back to actual views
        y_pred_log = model.predict(dmatrix)
        y_pred = np.expm1(y_pred_log)
        
        predicted_views = int(y_pred[0])
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"[PREDICT] Prediction completed: {predicted_views:,} views (took {processing_time:.2f}s)")
        
        # Determine confidence level based on prediction value
        if predicted_views > 1000000:
            confidence = "High"
        elif predicted_views > 100000:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        return PredictionResponse(
            predicted_views=predicted_views,
            confidence=confidence,
            processed_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"[ERROR] Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction failed: {str(e)}"
        )

# ================================
# 📌 Health Check Endpoint
# ================================
@app.get("/health")
async def health_check():
    """Health check endpoint to verify API status"""
    try:
        # Test model prediction with dummy data
        dummy_title = vectorizer_title.transform(["test"])
        dummy_desc = vectorizer_desc.transform(["test"])
        dummy_tags = vectorizer_tags.transform(["test"])
        dummy_combined = hstack([dummy_title, dummy_desc, dummy_tags])
        dummy_dmatrix = xgb.DMatrix(dummy_combined)
        model.predict(dummy_dmatrix)
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "model_loaded": True,
            "vectorizers_loaded": True
        }
    except Exception as e:
        logger.error(f"[ERROR] Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# ================================
# 📌 Root endpoint
# ================================
@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with API information and links"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>YouTube Views Predictor API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .links { display: flex; justify-content: center; gap: 20px; margin: 30px 0; }
            .link { padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .link:hover { background: #0056b3; }
            .info { background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .status { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎥 YouTube Views Predictor API</h1>
            <div class="status">✅ API is running and ready to serve predictions!</div>
            <p>A machine learning API to predict YouTube video views based on title, description, and tags.</p>
            
            <div class="links">
                <a href="/docs" class="link">📚 API Documentation (Swagger)</a>
                <a href="/redoc" class="link">📖 Alternative Docs (ReDoc)</a>
                <a href="/health" class="link">🔧 Health Check</a>
            </div>
            
            <div class="info">
                <h3>Quick Start:</h3>
                <p><strong>POST /predict</strong> - Make predictions</p>
                <p><strong>GET /health</strong> - Check API health</p>
                <p><strong>GET /docs</strong> - Interactive API documentation</p>
                
                <h4>Example Request:</h4>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto;">
POST /predict
{
  "title": "How to Build Amazing Apps",
  "description": "Learn to build apps with modern technologies",
  "tags_cleaned": "programming tutorial coding"
}</pre>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# ================================
# 📌 Run the server
# ================================
if __name__ == "__main__":
    import uvicorn
    
    logger.info("[STARTUP] Starting server...")
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=7000,
        reload=True,
        log_config=None  # Use our custom logging configuration
    )