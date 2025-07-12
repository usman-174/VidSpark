# ================================
# 📌 Imports
# ================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Union
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

# Sentiment analysis
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch.nn.functional as F
import torch

# Suppress sklearn warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ================================
# 📌 Logging Configuration
# ================================
def setup_logging():
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    logger = logging.getLogger("youtube_predictor")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(log_format)
    console_handler.setFormatter(console_formatter)

    log_file = log_dir / f"api_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(log_format)
    file_handler.setFormatter(file_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

logger = setup_logging()

# ================================
# 📌 Load Model and Vectorizers
# ================================
def load_model_components():
    try:
        logger.info("Loading model and vectorizers...")
        model = xgb.Booster()
        model.load_model("xgb_model.json")
        vectorizer_title = joblib.load("vectorizer_title.pkl")
        vectorizer_desc = joblib.load("vectorizer_desc.pkl")
        vectorizer_tags = joblib.load("vectorizer_tags.pkl")
        logger.info("[SUCCESS] All components loaded")
        return model, vectorizer_title, vectorizer_desc, vectorizer_tags
    except Exception as e:
        logger.error(f"[ERROR] Error loading model components: {str(e)}")
        raise

# ================================
# 📌 Load Sentiment Model
# ================================
def load_sentiment_model():
    try:
        logger.info("Loading sentiment analysis model...")
        model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        
        # Use pipeline for easier batch processing
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=model_name,
            tokenizer=model_name,
            device=0 if torch.cuda.is_available() else -1,
            truncation=True,
            max_length=512
        )
        
        logger.info("[SUCCESS] Sentiment model loaded")
        return sentiment_pipeline
    except Exception as e:
        logger.error(f"[ERROR] Failed to load sentiment model: {str(e)}")
        raise

def get_sentiment_single(text: str) -> Dict:
    """Get sentiment for a single text"""
    try:
        if not text or len(text.strip()) == 0:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
            }
        
        result = sentiment_pipeline(text[:512])  # Truncate to model max length
        
        # Convert to our format
        label_mapping = {
            "LABEL_0": "negative",
            "LABEL_1": "neutral", 
            "LABEL_2": "positive"
        }
        
        sentiment_label = label_mapping.get(result[0]['label'], result[0]['label'].lower())
        confidence = result[0]['score']
        
        # Create scores dict (approximate from confidence)
        scores = {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
        scores[sentiment_label] = confidence
        
        return {
            "sentiment": sentiment_label,
            "confidence": confidence,
            "scores": scores
        }
    except Exception as e:
        logger.error(f"[ERROR] Sentiment analysis failed for text: {str(e)}")
        return {
            "sentiment": "neutral",
            "confidence": 0.0,
            "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
        }

def get_sentiment_batch(texts: List[str]) -> List[Dict]:
    """Get sentiment for multiple texts"""
    try:
        if not texts:
            return []
        
        # Filter out empty texts and truncate
        processed_texts = []
        text_indices = []
        
        for i, text in enumerate(texts):
            if text and len(text.strip()) > 0:
                processed_texts.append(text[:512])  # Truncate to model max length
                text_indices.append(i)
        
        if not processed_texts:
            return [{"sentiment": "neutral", "confidence": 0.0, "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}}] * len(texts)
        
        # Get batch predictions
        results = sentiment_pipeline(processed_texts)
        
        # Convert to our format
        label_mapping = {
            "LABEL_0": "negative",
            "LABEL_1": "neutral", 
            "LABEL_2": "positive"
        }
        
        formatted_results = []
        result_idx = 0
        
        for i in range(len(texts)):
            if i in text_indices:
                result = results[result_idx]
                sentiment_label = label_mapping.get(result['label'], result['label'].lower())
                confidence = result['score']
                
                # Create scores dict (approximate from confidence)
                scores = {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
                scores[sentiment_label] = confidence
                
                formatted_results.append({
                    "sentiment": sentiment_label,
                    "confidence": confidence,
                    "scores": scores
                })
                result_idx += 1
            else:
                # Empty text case
                formatted_results.append({
                    "sentiment": "neutral",
                    "confidence": 0.0,
                    "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
                })
        
        return formatted_results
    except Exception as e:
        logger.error(f"[ERROR] Batch sentiment analysis failed: {str(e)}")
        # Return neutral sentiment for all texts on error
        return [{"sentiment": "neutral", "confidence": 0.0, "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}}] * len(texts)

# Global variables
model = None
vectorizer_title = None
vectorizer_desc = None
vectorizer_tags = None
sentiment_pipeline = None

# ================================
# 📌 Lifespan Events
# ================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[STARTUP] API is starting...")
    global model, vectorizer_title, vectorizer_desc, vectorizer_tags
    global sentiment_pipeline

    model, vectorizer_title, vectorizer_desc, vectorizer_tags = load_model_components()
    sentiment_pipeline = load_sentiment_model()

    yield
    logger.info("[SHUTDOWN] API is shutting down...")

# ================================
# 📌 FastAPI app initialization
# ================================
app = FastAPI(
    title="YouTube Views Predictor API",
    description="Predict YouTube views and analyze sentiment from video metadata",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# 📌 Input / Output Schemas
# ================================
class VideoInput(BaseModel):
    title: str
    description: str
    tags_cleaned: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "How to Build a Machine Learning API with FastAPI",
                "description": "In this tutorial, we'll learn how to create a REST API using FastAPI and deploy a machine learning model for predictions.",
                "tags_cleaned": "fastapi machine learning python api tutorial"
            }
        }
    }

class SentimentInput(BaseModel):
    text: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "This is a great tutorial on machine learning!"
            }
        }
    }

class BatchSentimentInput(BaseModel):
    texts: List[str]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "texts": [
                    "This is a great tutorial!",
                    "I didn't like this video",
                    "This was okay, nothing special"
                ]
            }
        }
    }

class PredictionResponse(BaseModel):
    predicted_views: int
    confidence: str
    processed_at: str

class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    scores: Dict[str, float]
    processed_at: str

class BatchSentimentResponse(BaseModel):
    results: List[Dict]
    total_processed: int
    processed_at: str

# ================================
# 📌 Prediction Endpoint
# ================================
@app.post("/predict", response_model=PredictionResponse)
async def predict_views(video: VideoInput):
    try:
        start_time = datetime.now()
        logger.info(f"[PREDICT] Input received: '{video.title[:50]}...'")

        X_title = vectorizer_title.transform([video.title])
        X_desc = vectorizer_desc.transform([video.description])
        X_tags = vectorizer_tags.transform([video.tags_cleaned])
        X_combined = hstack([X_title, X_desc, X_tags])

        dmatrix = xgb.DMatrix(X_combined)
        y_pred_log = model.predict(dmatrix)
        y_pred = np.expm1(y_pred_log)

        predicted_views = int(y_pred[0])
        processing_time = (datetime.now() - start_time).total_seconds()

        confidence = (
            "High" if predicted_views > 1_000_000 else
            "Medium" if predicted_views > 100_000 else
            "Low"
        )

        logger.info(f"[PREDICT] Done: {predicted_views:,} views (in {processing_time:.2f}s)")

        return PredictionResponse(
            predicted_views=predicted_views,
            confidence=confidence,
            processed_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"[ERROR] Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ================================
# 📌 Single Sentiment Endpoint
# ================================
@app.post("/sentiment", response_model=SentimentResponse)
async def sentiment_analysis(sentiment_input: SentimentInput):
    try:
        start_time = datetime.now()
        logger.info(f"[SENTIMENT] Processing single text: '{sentiment_input.text[:50]}...'")
        
        result = get_sentiment_single(sentiment_input.text)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"[SENTIMENT] Done: {result['sentiment']} (in {processing_time:.2f}s)")
        
        return SentimentResponse(
            sentiment=result['sentiment'],
            confidence=result['confidence'],
            scores=result['scores'],
            processed_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"[ERROR] Sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

# ================================
# 📌 Batch Sentiment Endpoint
# ================================
@app.post("/batch-sentiment", response_model=BatchSentimentResponse)
async def batch_sentiment_analysis(batch_input: BatchSentimentInput):
    try:
        start_time = datetime.now()
        logger.info(f"[BATCH_SENTIMENT] Processing {len(batch_input.texts)} texts")
        
        results = get_sentiment_batch(batch_input.texts)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"[BATCH_SENTIMENT] Done: {len(results)} results (in {processing_time:.2f}s)")
        
        return BatchSentimentResponse(
            results=results,
            total_processed=len(results),
            processed_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"[ERROR] Batch sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch sentiment analysis failed: {str(e)}")

# ================================
# 📌 Health Check Endpoint
# ================================
@app.get("/health")
async def health_check():
    try:
        # Test prediction model
        dummy_title = vectorizer_title.transform(["test"])
        dummy_desc = vectorizer_desc.transform(["test"])
        dummy_tags = vectorizer_tags.transform(["test"])
        dummy_combined = hstack([dummy_title, dummy_desc, dummy_tags])
        dummy_dmatrix = xgb.DMatrix(dummy_combined)
        model.predict(dummy_dmatrix)

        # Test sentiment model
        test_sentiment = get_sentiment_single("This is a test")

        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "model_loaded": True,
            "sentiment_loaded": True,
            "test_sentiment": test_sentiment
        }
    except Exception as e:
        logger.error(f"[ERROR] Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# ================================
# 📌 Root Endpoint
# ================================
@app.get("/", response_class=HTMLResponse)
async def root():
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
            <div class="status">✅ API is running and ready!</div>
            <p>This API predicts YouTube video views and performs sentiment analysis on video metadata.</p>
            <div class="links">
                <a href="/docs" class="link">📚 Swagger Docs</a>
                <a href="/redoc" class="link">📖 ReDoc</a>
                <a href="/health" class="link">🔧 Health Check</a>
            </div>
            <div class="info">
                <h3>Endpoints:</h3>
                <ul>
                    <li><strong>POST /predict</strong> - Predict video views</li>
                    <li><strong>POST /sentiment</strong> - Analyze single text sentiment</li>
                    <li><strong>POST /batch-sentiment</strong> - Analyze multiple texts sentiment</li>
                    <li><strong>GET /health</strong> - Check API health</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# ================================
# 📌 Run the Server
# ================================
if __name__ == "__main__":
    import uvicorn
    logger.info("[STARTUP] Running dev server...")
    uvicorn.run("server:app", host="0.0.0.0", port=7000, reload=True, log_config=None)