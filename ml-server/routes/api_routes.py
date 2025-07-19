from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict
from controllers.api_controller import (
    predict_views_controller,
    sentiment_analysis_controller,
    batch_sentiment_analysis_controller,
    health_check_controller
)

router = APIRouter()

class VideoInput(BaseModel):
    title: str
    description: str
    tags_cleaned: str

class SentimentInput(BaseModel):
    text: str

class BatchSentimentInput(BaseModel):
    texts: List[str]

@router.get("/", response_class=HTMLResponse)
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

@router.post("/predict")
async def predict_views(video: VideoInput):
    return await predict_views_controller(video)

@router.post("/sentiment")
async def sentiment_analysis(sentiment_input: SentimentInput):
    return await sentiment_analysis_controller(sentiment_input)

@router.post("/batch-sentiment")
async def batch_sentiment_analysis(batch_input: BatchSentimentInput):
    return await batch_sentiment_analysis_controller(batch_input)

@router.get("/health")
async def health_check():
    return await health_check_controller() 