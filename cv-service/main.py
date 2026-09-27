# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, UploadFile
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from detector import HandDetector
from predictor import GesturePredictor

app = FastAPI(title="ISL Gesture Recognition Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = HandDetector()
predictor = None  # loaded lazily so the server can still start before training


@app.on_event("startup")
def load_model():
    global predictor
    try:
        predictor = GesturePredictor()
        print("Model loaded successfully.")
    except FileNotFoundError as e:
        print(f"WARNING: {e}")
        print("The /predict endpoint will fail until you train a model.")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": predictor is not None}


@app.post("/reload-model")
def reload_model():
    """
    Call this after retraining, instead of restarting the whole server.
    The model file is only ever read into memory here or at startup —
    training a new isl_model.pkl on disk does nothing to a running
    server until this is called (or the server is restarted).
    """
    global predictor
    try:
        predictor = GesturePredictor()
        return {"status": "reloaded", "model_loaded": True}
    except FileNotFoundError as e:
        return {"status": "error", "message": str(e), "model_loaded": False}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if predictor is None:
        return {"error": "Model not loaded. Run scripts/train_model.py first."}

    contents = await file.read()
    np_array = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    landmarks, _ = detector.find_landmarks(frame)

    if landmarks is None:
        return {"hand_detected": False, "predicted_sign": None, "confidence": 0.0}

    predicted_sign, confidence = predictor.predict(landmarks)

    return {
        "hand_detected": True,
        "predicted_sign": predicted_sign,
        "confidence": round(confidence, 4),
    }

# Run with: uvicorn main:app --reload --port 8000