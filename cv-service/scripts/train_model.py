import os
import sys
import glob
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
# pyrefly: ignore [missing-import]
import joblib

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
CSV_PATH = os.path.join(DATASET_DIR, "landmarks.csv")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "isl_model.pkl")


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    # Merge every CSV in dataset/ (e.g. landmarks.csv from live recording,
    # landmarks_images.csv from batch image extraction) so both sources
    # of data train together automatically.
    csv_paths = glob.glob(os.path.join(DATASET_DIR, "*.csv"))
    if not csv_paths:
        print(f"No dataset CSVs found in {DATASET_DIR}. Collect some data first.")
        return

    df = pd.concat([pd.read_csv(p) for p in csv_paths], ignore_index=True)
    print(f"Loaded {len(df)} samples from {len(csv_paths)} file(s): {[os.path.basename(p) for p in csv_paths]}")
    print(df["label"].value_counts())

    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=400, min_samples_leaf=2, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()