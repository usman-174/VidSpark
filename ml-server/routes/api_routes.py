from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from datetime import datetime

from typing import List, Dict, Optional
from controllers.api_controller import (
    predict_views_controller,
    predict_views_controller_versioned,
    sentiment_analysis_controller,
    batch_sentiment_analysis_controller,
    health_check_controller
)

router = APIRouter()

# Pydantic Models
class VideoInput(BaseModel):
    """Basic video input for v1 model (backward compatibility)"""
    title: str = Field(..., description="Video title")
    description: str = Field(..., description="Video description")
    tags_cleaned: str = Field(..., description="Cleaned tags string")

class VideoInputV2(BaseModel):
    """Enhanced video input for v2 model"""
    title: str = Field(..., description="Video title")
    description: str = Field(..., description="Video description") 
    tags_cleaned: str = Field(..., description="Cleaned tags string")
    category_id: int = Field(..., ge=1, le=50, description="YouTube category ID (1-50)")
    publish_hour: int = Field(..., ge=0, le=23, description="Hour of publishing (0-23)")
    days_to_trending: int = Field(..., ge=0, description="Days from publish to trending")

class SentimentInput(BaseModel):
    """Input for sentiment analysis"""
    text: str = Field(..., description="Text to analyze sentiment")

class BatchSentimentInput(BaseModel):
    """Input for batch sentiment analysis"""
    texts: List[str] = Field(..., description="List of texts to analyze")

# HTML Landing Page
@router.get("/", response_class=HTMLResponse)
async def root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>YouTube Views Predictor API</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .container { max-width: 1000px; margin: 0 auto; background: white; margin-top: 50px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 40px; }
            h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
            .subtitle { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }
            .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 30px 0; }
            .link { padding: 15px 25px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; text-align: center; transition: all 0.3s; font-weight: 500; }
            .link:hover { background: #0056b3; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,123,255,0.3); }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
            .info-card { background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 4px solid #007bff; }
            .info-card h3 { color: #333; margin-top: 0; }
            .status { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: 500; }
            .version-badge { background: #6f42c1; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; margin-left: 10px; }
            .endpoint { background: #e9ecef; padding: 10px; border-radius: 5px; margin: 5px 0; font-family: monospace; }
            .model-comparison { background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎥 YouTube Views Predictor API</h1>
                <p class="subtitle">Advanced ML-powered predictions with multi-model support</p>
            </div>
            <div class="content">
                <div class="status">✅ API is running with v1 & v2 models loaded!</div>
                
                <div class="links">
                    <a href="/docs" class="link">📚 Swagger Docs</a>
                    <a href="/redoc" class="link">📖 ReDoc</a>
                    <a href="/health" class="link">🔧 Health Check</a>
                    <a href="/docs#/default/predict_views_v2_v2_predict_post" class="link">🚀 Try v2 Model</a>
                </div>

                <div class="model-comparison">
                    <h3>📊 Model Comparison</h3>
                    <p><strong>v1 Model:</strong> Text-only features (title, description, tags) - Legacy compatible</p>
                    <p><strong>v2 Model:</strong> Enhanced with category, timing, and engagement features - Higher accuracy</p>
                </div>
                
                <div class="info-grid">
                    <div class="info-card">
                        <h3>🎯 Prediction Endpoints</h3>
                        <div class="endpoint">POST /predict <span class="version-badge">v1</span></div>
                        <div class="endpoint">POST /v2/predict <span class="version-badge">v2</span></div>
                        <div class="endpoint">POST /predict/{version} <span class="version-badge">dynamic</span></div>
                        <p>Predict YouTube video views using different model versions</p>
                    </div>
                    
                    <div class="info-card">
                        <h3>💭 Sentiment Analysis</h3>
                        <div class="endpoint">POST /sentiment</div>
                        <div class="endpoint">POST /batch-sentiment</div>
                        <p>Analyze sentiment of video titles, descriptions, and comments</p>
                    </div>
                    
                    <div class="info-card">
                        <h3>🔧 System Endpoints</h3>
                        <div class="endpoint">GET /health</div>
                        <div class="endpoint">GET /models/info</div>
                        <p>Health checks and model information</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# Legacy endpoints (backward compatibility)
@router.post("/predict", 
    summary="Predict Views (v1 Model)", 
    description="Legacy endpoint using v1 model with text-only features. Maintained for backward compatibility.")
async def predict_views(video: VideoInput):
    """Legacy prediction endpoint - uses v1 model for backward compatibility"""
    return await predict_views_controller(video)

# New v2 endpoints
@router.post("/v2/predict",
    summary="Predict Views (v2 Enhanced Model)",
    description="Enhanced v2 model with additional features: category_id, publish_hour, days_to_trending")
async def predict_views_v2(video: VideoInputV2):
    """Enhanced prediction endpoint - uses v2 model with additional features"""
    return await predict_views_controller_versioned(video, version="v2")

# Dynamic version endpoint
@router.post("/predict/{version}",
    summary="Predict Views (Dynamic Version)",
    description="Dynamically choose model version. Supports 'v1' or 'v2'")
async def predict_views_dynamic(
    version: str,
    video: VideoInputV2
):
    """Dynamic prediction endpoint - choose model version"""
    if version not in ["v1", "v2"]:
        raise HTTPException(status_code=400, detail="Invalid version. Use 'v1' or 'v2'")
    
    # Convert v2 input to v1 input if needed
    if version == "v1":
        video_v1 = VideoInput(
            title=video.title,
            description=video.description,
            tags_cleaned=video.tags_cleaned
        )
        return await predict_views_controller_versioned(video_v1, version="v1")
    else:
        return await predict_views_controller_versioned(video, version="v2")

# Sentiment analysis endpoints
@router.post("/sentiment",
    summary="Analyze Single Text Sentiment",
    description="Analyze sentiment of a single text using RoBERTa model")
async def sentiment_analysis(sentiment_input: SentimentInput):
    """Analyze sentiment of single text"""
    return await sentiment_analysis_controller(sentiment_input)

@router.post("/batch-sentiment",
    summary="Analyze Multiple Texts Sentiment", 
    description="Analyze sentiment of multiple texts in batch for efficiency")
async def batch_sentiment_analysis(batch_input: BatchSentimentInput):
    """Analyze sentiment of multiple texts in batch"""
    return await batch_sentiment_analysis_controller(batch_input)

# System endpoints
@router.get("/health",
    summary="Health Check",
    description="Check API health and model loading status")
async def health_check():
    """Check API health and model status"""
    return await health_check_controller()

@router.get("/models/info",
    summary="Model Information", 
    description="Get information about available models and their features")
async def models_info():
    """Get information about available models"""
    return {
        "available_models": {
            "v1": {
                "description": "Legacy model with text-only features",
                "features": ["title", "description", "tags_cleaned"],
                "endpoint": "/predict",
                "backward_compatible": True
            },
            "v2": {
                "description": "Enhanced model with additional features",
                "features": ["title", "description", "tags_cleaned", "category_id", "publish_hour", "days_to_trending"],
                "endpoint": "/v2/predict",
                "enhanced_accuracy": True
            }
        },
        "recommendation": "Use v2 model for better accuracy with enhanced features",
        "migration_guide": "v1 endpoints remain unchanged for backward compatibility",
        "timestamp": datetime.now().isoformat()
    }

# Example data endpoints for testing
@router.get("/examples",
    summary="Example Data",
    description="Get example input data for testing different model versions")
async def get_examples():
    """Get example input data for testing"""
    return {
        "v1_example": {
            "title": "Amazing Tech Review 2024",
            "description": "In this video, we review the latest smartphone features and compare them with previous generations. This comprehensive review covers camera quality, battery life, and performance benchmarks.",
            "tags_cleaned": "tech review smartphone 2024 gadgets mobile technology"
        },
        "v2_example": {
            "title": "Amazing Tech Review 2024", 
            "description": "In this video, we review the latest smartphone features and compare them with previous generations. This comprehensive review covers camera quality, battery life, and performance benchmarks.",
            "tags_cleaned": "tech review smartphone 2024 gadgets mobile technology",
            "category_id": 28,  # Science & Technology
            "publish_hour": 14,  # 2 PM
            "days_to_trending": 3
        },
        "sentiment_example": {
            "text": "This video is absolutely amazing! Great content and very informative."
        },
        "batch_sentiment_example": {
            "texts": [
                "This video is absolutely amazing!",
                "Not very good content, disappointed.",
                "Average video, nothing special but okay."
            ]
        }
    }