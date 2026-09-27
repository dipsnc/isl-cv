// Client for the cv-service FastAPI backend (cv-service/main.py).
// Configure the URL via VITE_CV_SERVICE_URL in a .env file at the frontend root,
// e.g. VITE_CV_SERVICE_URL=http://localhost:8000
const CV_SERVICE_URL = import.meta.env.VITE_CV_SERVICE_URL || 'http://localhost:8000';

export type PredictResponse = {
  hand_detected: boolean;
  predicted_sign: string | null;
  confidence: number;
  error?: string;
};

export type HealthResponse = {
  status: string;
  model_loaded: boolean;
};

/** GET /health — check the service is up and a model is loaded. */
export async function checkCvServiceHealth(): Promise<HealthResponse> {
  const res = await fetch(`${CV_SERVICE_URL}/health`);
  if (!res.ok) throw new Error(`cv-service /health failed: ${res.status}`);
  return res.json();
}

/** POST /predict — send a single JPEG/PNG frame, get back the predicted sign. */
export async function predictSign(imageBlob: Blob): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'frame.jpg');

  const res = await fetch(`${CV_SERVICE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`cv-service /predict failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Grabs the current frame from a <video> element and returns it as a JPEG Blob,
 * ready to hand to predictSign(). Uses an offscreen canvas — no library needed.
 */
export function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9));
}
