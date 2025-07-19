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

# Configurable model paths
MODEL_CONFIGS = {
    "v1": {
        "path": Path("models") / "xgboost" / "v1",
        "features": ["title", "description", "tags_cleaned"]  # Original model
    },
    "v2": {
        "path": Path("models") / "xgboost" / "v2", 
        "features": ["title", "description", "tags_cleaned", "category_id", "publish_hour", "days_to_trending"]  # New enhanced model
    }
}

# Global cache for multiple models
models_cache = {}
sentiment_pipeline = None
logger = logging.getLogger("youtube_predictor")

def load_model_components(version="v1"):
    """Load model components for specified version"""
    global models_cache
    
    if version in models_cache:
        return models_cache[version]
    
    if version not in MODEL_CONFIGS:
        raise ValueError(f"Unknown model version: {version}. Available: {list(MODEL_CONFIGS.keys())}")
    
    try:
        model_path = MODEL_CONFIGS[version]["path"]
        logger.info(f"Loading model version {version} from {model_path}...")
        
        # Load XGBoost model
        model = xgb.Booster()
        model.load_model(str(model_path / "xgb_model.json"))
        
        # Load vectorizers
        vectorizer_title = joblib.load(str(model_path / "vectorizer_title.pkl"))
        vectorizer_desc = joblib.load(str(model_path / "vectorizer_desc.pkl")) 
        vectorizer_tags = joblib.load(str(model_path / "vectorizer_tags.pkl"))
        
        components = {
            "model": model,
            "vectorizer_title": vectorizer_title,
            "vectorizer_desc": vectorizer_desc,
            "vectorizer_tags": vectorizer_tags,
            "features": MODEL_CONFIGS[version]["features"]
        }
        
        # Load additional components for v2
        if version == "v2":
            try:
                components["category_encoder"] = joblib.load(str(model_path / "category_encoder.pkl"))
                components["numeric_scaler"] = joblib.load(str(model_path / "numeric_scaler.pkl"))
                logger.info(f"[SUCCESS] Enhanced model v2 components loaded")
            except FileNotFoundError as e:
                logger.warning(f"[WARNING] Some v2 components missing: {e}")
        
        models_cache[version] = components
        logger.info(f"[SUCCESS] Model {version} loaded and cached")
        return components
        
    except Exception as e:
        logger.error(f"[ERROR] Error loading model {version}: {str(e)}")
        raise

def load_sentiment_model():
    """Load sentiment analysis model"""
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
    """Analyze sentiment for single text"""
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
    """Analyze sentiment for multiple texts"""
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

# Legacy controller (maintains backward compatibility)
async def predict_views_controller(video):
    """Legacy prediction controller - uses v1 model"""
    return await predict_views_controller_versioned(video, version="v1")

async def predict_views_controller_versioned(video, version="v1"):
    """Versioned prediction controller"""
    components = load_model_components(version)
    
    try:
        # Extract components
        model = components["model"]
        vectorizer_title = components["vectorizer_title"]
        vectorizer_desc = components["vectorizer_desc"] 
        vectorizer_tags = components["vectorizer_tags"]
        
        # Vectorize text features
        X_title = vectorizer_title.transform([video.title])
        X_desc = vectorizer_desc.transform([video.description])
        X_tags = vectorizer_tags.transform([video.tags_cleaned])
        
        # Handle different model versions
        if version == "v1":
            # Original model - text features only
            X_combined = hstack([X_title, X_desc, X_tags])
        elif version == "v2":
            # Enhanced model - text + numeric features
            category_encoder = components["category_encoder"]
            numeric_scaler = components["numeric_scaler"]
            
            # Process numeric features
            category_encoded = category_encoder.transform([[video.category_id]])
            numeric_scaled = numeric_scaler.transform([[video.publish_hour, video.days_to_trending]])
            numeric_features = np.hstack([category_encoded, numeric_scaled])
            
            # Combine all features
            X_combined = hstack([X_title, X_desc, X_tags, numeric_features])
        
        # Make prediction
        dmatrix = xgb.DMatrix(X_combined)
        y_pred_log = model.predict(dmatrix)
        y_pred = np.expm1(y_pred_log)
        predicted_views = int(y_pred[0])
        
        # Calculate confidence
        confidence = (
            "High" if predicted_views > 1_000_000 else
            "Medium" if predicted_views > 100_000 else
            "Low"
        )
        
        return {
            "predicted_views": predicted_views,
            "confidence": confidence,
            "model_version": version,
            "features_used": components["features"],
            "processed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Prediction failed for version {version}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

async def sentiment_analysis_controller(sentiment_input):
    """Sentiment analysis controller"""
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
    """Batch sentiment analysis controller"""
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
    """Health check controller"""
    try:
        # Test both model versions
        v1_components = load_model_components("v1")
        v2_components = load_model_components("v2") 
        load_sentiment_model()
        
        # Test v1 model
        dummy_title = v1_components["vectorizer_title"].transform(["test"])
        dummy_desc = v1_components["vectorizer_desc"].transform(["test"])
        dummy_tags = v1_components["vectorizer_tags"].transform(["test"])
        dummy_combined_v1 = hstack([dummy_title, dummy_desc, dummy_tags])
        dummy_dmatrix_v1 = xgb.DMatrix(dummy_combined_v1)
        v1_components["model"].predict(dummy_dmatrix_v1)
        
        # Test v2 model
        dummy_title_v2 = v2_components["vectorizer_title"].transform(["test"])
        dummy_desc_v2 = v2_components["vectorizer_desc"].transform(["test"])
        dummy_tags_v2 = v2_components["vectorizer_tags"].transform(["test"])
        dummy_category = v2_components["category_encoder"].transform([[1]])
        dummy_numeric = v2_components["numeric_scaler"].transform([[12, 1]])
        dummy_numeric_features = np.hstack([dummy_category, dummy_numeric])
        dummy_combined_v2 = hstack([dummy_title_v2, dummy_desc_v2, dummy_tags_v2, dummy_numeric_features])
        dummy_dmatrix_v2 = xgb.DMatrix(dummy_combined_v2)
        v2_components["model"].predict(dummy_dmatrix_v2)
        
        # Test sentiment
        test_sentiment = get_sentiment_single("This is a test")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "models_loaded": {
                "v1": True,
                "v2": True
            },
            "sentiment_loaded": True,
            "available_versions": list(MODEL_CONFIGS.keys()),
            "test_sentiment": test_sentiment
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }