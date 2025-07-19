import xgboost as xgb
import joblib
from scipy.sparse import hstack
import numpy as np
from datetime import datetime
from fastapi import HTTPException
from transformers import pipeline
import torch
import logging
from pathlib import Path

# Configurable model path (change here for v2 or linear/v1)
MODEL_TYPE = "xgboost"
MODEL_VERSION = "v1"
MODEL_BASE_PATH = Path("models") / MODEL_TYPE / MODEL_VERSION

# Global cache
model = None
vectorizer_title = None
vectorizer_desc = None
vectorizer_tags = None
sentiment_pipeline = None
logger = logging.getLogger("youtube_predictor")

# Load model and vectorizers
def load_model_components():
    global model, vectorizer_title, vectorizer_desc, vectorizer_tags
    if model is not None:
        return
    try:
        logger.info(f"Loading model and vectorizers from {MODEL_BASE_PATH}...")
        model = xgb.Booster()
        model.load_model(str(MODEL_BASE_PATH / "xgb_model.json"))
        vectorizer_title = joblib.load(str(MODEL_BASE_PATH / "vectorizer_title.pkl"))
        vectorizer_desc = joblib.load(str(MODEL_BASE_PATH / "vectorizer_desc.pkl"))
        vectorizer_tags = joblib.load(str(MODEL_BASE_PATH / "vectorizer_tags.pkl"))
        logger.info("[SUCCESS] All components loaded")
    except Exception as e:
        logger.error(f"[ERROR] Error loading model components: {str(e)}")
        raise

def load_sentiment_model():
    global sentiment_pipeline
    if sentiment_pipeline is not None:
        return
    try:
        logger.info("Loading sentiment analysis model...")
        model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=model_name,
            tokenizer=model_name,
            device=0 if torch.cuda.is_available() else -1,
            truncation=True,
            max_length=512
        )
        logger.info("[SUCCESS] Sentiment model loaded")
    except Exception as e:
        logger.error(f"[ERROR] Failed to load sentiment model: {str(e)}")
        raise

def get_sentiment_single(text: str) -> dict:
    try:
        if not text or len(text.strip()) == 0:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
            }
        result = sentiment_pipeline(text[:512])
        label_mapping = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
        sentiment_label = label_mapping.get(result[0]['label'], result[0]['label'].lower())
        confidence = result[0]['score']
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

def get_sentiment_batch(texts: list) -> list:
    try:
        if not texts:
            return []
        processed_texts = []
        text_indices = []
        for i, text in enumerate(texts):
            if text and len(text.strip()) > 0:
                processed_texts.append(text[:512])
                text_indices.append(i)
        if not processed_texts:
            return [{"sentiment": "neutral", "confidence": 0.0, "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}}] * len(texts)
        results = sentiment_pipeline(processed_texts)
        label_mapping = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
        formatted_results = []
        result_idx = 0
        for i in range(len(texts)):
            if i in text_indices:
                result = results[result_idx]
                sentiment_label = label_mapping.get(result['label'], result['label'].lower())
                confidence = result['score']
                scores = {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
                scores[sentiment_label] = confidence
                formatted_results.append({
                    "sentiment": sentiment_label,
                    "confidence": confidence,
                    "scores": scores
                })
                result_idx += 1
            else:
                formatted_results.append({
                    "sentiment": "neutral",
                    "confidence": 0.0,
                    "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
                })
        return formatted_results
    except Exception as e:
        logger.error(f"[ERROR] Batch sentiment analysis failed: {str(e)}")
        return [{"sentiment": "neutral", "confidence": 0.0, "scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33}}] * len(texts)

# Controller functions
async def predict_views_controller(video):
    load_model_components()
    try:
        X_title = vectorizer_title.transform([video.title])
        X_desc = vectorizer_desc.transform([video.description])
        X_tags = vectorizer_tags.transform([video.tags_cleaned])
        X_combined = hstack([X_title, X_desc, X_tags])
        dmatrix = xgb.DMatrix(X_combined)
        y_pred_log = model.predict(dmatrix)
        y_pred = np.expm1(y_pred_log)
        predicted_views = int(y_pred[0])
        confidence = (
            "High" if predicted_views > 1_000_000 else
            "Medium" if predicted_views > 100_000 else
            "Low"
        )
        return {
            "predicted_views": predicted_views,
            "confidence": confidence,
            "processed_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"[ERROR] Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

async def sentiment_analysis_controller(sentiment_input):
    load_sentiment_model()
    try:
        result = get_sentiment_single(sentiment_input.text)
        return {
            "sentiment": result['sentiment'],
            "confidence": result['confidence'],
            "scores": result['scores'],
            "processed_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"[ERROR] Sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

async def batch_sentiment_analysis_controller(batch_input):
    load_sentiment_model()
    try:
        results = get_sentiment_batch(batch_input.texts)
        return {
            "results": results,
            "total_processed": len(results),
            "processed_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"[ERROR] Batch sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch sentiment analysis failed: {str(e)}")

async def health_check_controller():
    load_model_components()
    load_sentiment_model()
    try:
        dummy_title = vectorizer_title.transform(["test"])
        dummy_desc = vectorizer_desc.transform(["test"])
        dummy_tags = vectorizer_tags.transform(["test"])
        dummy_combined = hstack([dummy_title, dummy_desc, dummy_tags])
        dummy_dmatrix = xgb.DMatrix(dummy_combined)
        model.predict(dummy_dmatrix)
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