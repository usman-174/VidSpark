# ================================
# 📌 Imports
# ================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
from datetime import datetime
from pathlib import Path
import os

# Import routes
from routes.api_routes import router as api_router

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
# 📌 Lifespan Events
# ================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[STARTUP] API is starting...")
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
# 📌 Include API Routes
# ================================
app.include_router(api_router)

# ================================
# 📌 Run the Server
# ================================
if __name__ == "__main__":
    import uvicorn
    logger.info("[STARTUP] Running dev server...")
    uvicorn.run("server:app", host="0.0.0.0", port=int(os.getenv("PORT", 10000)))
