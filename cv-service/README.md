# ISL CV Service — Setup Guide

## File structure

```
cv-service/
├── config.py                      ← sign list (single source of truth)
├── detector.py                    ← MediaPipe wrapper, tracks up to 2 hands
├── predictor.py                   ← loads the trained model, makes predictions
├── main.py                        ← FastAPI server, exposes POST /predict
├── requirements.txt
├── scripts/
│   ├── collect_landmarks.py           ← webcam tool: live burst recording
│   ├── capture_images.py              ← webcam tool: one photo per keypress
│   ├── extract_landmarks_from_images.py ← turns saved photos into landmark rows
│   ├── train_model.py                 ← trains the Random Forest, saves isl_model.pkl
│   └── live_test.py                   ← sanity-check predictions live, no API needed
├── dataset/
│   ├── landmarks.csv               ← from collect_landmarks.py (live burst)
│   ├── landmarks_images.csv        ← from extract_landmarks_from_images.py (batch)
│   └── raw_images/<SIGN>/*.jpg     ← photos, either yours or from an external dataset
└── models/
    └── isl_model.pkl               ← created automatically when you train
```

Everything imports `config.py` for the sign list, so signs can never drift out
of sync between collection, training, and prediction. `train_model.py` merges
**every** CSV in `dataset/`, so both collection methods train together
automatically — you don't have to pick one.

---

## Step 1 — Set up the environment

```bash
cd cv-service
python -m venv venv

# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

## Step 2 — Get training data (two ways, mix freely)

### Option A: live burst recording
```bash
python scripts/collect_landmarks.py
```
Press `0`-`9` to pick a sign, hold `SPACE` while posing (vary angle/distance
slightly), `q` to quit. For two-handed signs, keep both hands inside the frame
and not overlapping — watch the "Hands detected" counter and only record when
it reads 2.

### Option B: individual photos (do a few, come back later, repeat)
```bash
python scripts/capture_images.py
```
Press `0`-`9` to pick a sign, `c` to snap one photo, `q` to quit. Saves to
`dataset/raw_images/<SIGN>/`. This is also how you fold in external datasets —
see the section below.

If you used Option B, convert the photos into landmark rows:
```bash
python scripts/extract_landmarks_from_images.py
```
Safe to re-run any time you add more photos — it rebuilds the file from
scratch, so there's no duplicate-row risk.

Aim for 150-250 samples per sign either way, roughly balanced across signs.

## Step 3 — Train the model

```bash
python scripts/train_model.py
```

Prints per-sign accuracy and saves `models/isl_model.pkl`. If a sign performs
poorly, add more samples for just that sign and retrain.

## Step 4 — Sanity-check it live (recommended before trusting any accuracy number)

```bash
python scripts/live_test.py
```

Move naturally, redo each sign fresh, vary angle/distance. High and stable
confidence here is a much better signal than a train/test split score.

## Step 5 — Start the prediction server

```bash
uvicorn main:app --reload --port 8000
curl http://localhost:8000/health
```

## Step 6 — Connect from React

```javascript
async function predictSign(blob) {
  const formData = new FormData();
  formData.append("file", blob, "frame.jpg");

  const response = await fetch("http://localhost:8000/predict", {
    method: "POST",
    body: formData,
  });

  return await response.json();
  // { hand_detected, predicted_sign, confidence }
}
```

---

## Integrating an external dataset (e.g. RealSign62 ISL alphabet images)

1. Download and unzip the dataset (e.g. RealSign62's `Dataset.zip`, which
   contains `Training/A/`, `Training/B/`, ... `Training/Z/`).
2. Add the new signs to `config.py`:
   ```python
   SIGNS = ["HELLO", "THANK_YOU", "WATER", "HELP", "PLEASE", "A", "B", "C", "D"]
   ```
3. Copy a subset of images (150-250 is plenty — you don't need all ~1000 per
   letter) straight into matching folders under `dataset/raw_images/`:
   ```
   dataset/raw_images/A/   ← copy some files from Training/A/
   dataset/raw_images/B/   ← copy some files from Training/B/
   dataset/raw_images/C/   ← copy some files from Training/C/
   dataset/raw_images/D/   ← copy some files from Training/D/
   ```
   Folder name = exact label used in `config.py` and in the CSV — keep them
   matching (all-caps here, e.g. `A` not `a`).
4. Extract landmarks and retrain:
   ```bash
   python scripts/extract_landmarks_from_images.py
   python scripts/train_model.py
   ```

Your existing HELLO/THANK_YOU/WATER/HELP/PLEASE data (in `landmarks.csv`)
is untouched and trains alongside the new letters automatically.

To add more signs later — self-recorded or from another dataset — repeat
steps 2-4. Nothing else in the codebase needs to change.

---

## Notes

- Signs are treated as **held static poses** (one frame in, one prediction
  out). For signs with real motion, have users hold the final hand shape
  steady for the camera.
- Up to 2 hands are tracked per frame (`NUM_HANDS = 2` in `detector.py`),
  ordered left-to-right by wrist position for consistency. Missing hands are
  zero-padded, which itself helps the model tell one-handed and two-handed
  signs apart.
