# ================================
# 📌 Imports
# ================================
from fastapi import FastAPI
from pydantic import BaseModel
import xgboost as xgb
import joblib
from scipy.sparse import hstack
import numpy as np

# ================================
# 📌 Load Model and Vectorizers
# ================================
model = xgb.Booster()
model.load_model("xgb_model.json")

vectorizer_title = joblib.load("vectorizer_title.pkl")
vectorizer_desc = joblib.load("vectorizer_desc.pkl")
vectorizer_tags = joblib.load("vectorizer_tags.pkl")

# ================================
# 📌 FastAPI app initialization
# ================================
app = FastAPI(title="YouTube Views Predictor API")

# ================================
# 📌 Input Schema
# ================================
class VideoInput(BaseModel):
    title: str
    description: str
    tags_cleaned: str

# ================================
# 📌 Prediction Endpoint
# ================================
@app.post("/predict")
def predict_views(video: VideoInput):
    # Vectorize inputs
    X_title = vectorizer_title.transform([video.title])
    X_desc = vectorizer_desc.transform([video.description])
    X_tags = vectorizer_tags.transform([video.tags_cleaned])

    # Combine features
    X_combined = hstack([X_title, X_desc, X_tags])

    # Convert to DMatrix
    dmatrix = xgb.DMatrix(X_combined)

    # Predict log views and convert back to actual views
    y_pred_log = model.predict(dmatrix)
    y_pred = np.expm1(y_pred_log)

    return {
        "predicted_views": int(y_pred[0])
    }

# ================================
# 📌 Root endpoint
# ================================
@app.get("/")
def root():
    return {"message": "YouTube Views Prediction API is running."}
