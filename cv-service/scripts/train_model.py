import os
import sys
import glob
import argparse
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report
# pyrefly: ignore [missing-import]
import joblib

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "isl_model.pkl")

FEATURES_PER_HAND = 63  # 21 landmarks x (x, y, z), matches detector.py
MIN_RECOMMENDED_SAMPLES = 150


def mirror_augment(df):
    """
    For every row where only one hand was detected (the second hand's 63
    features are all zero — see detector.py), adds a horizontally-mirrored
    duplicate: negates the x-component of each of the 21 landmarks in the
    active hand.

    Landmarks are already translated to the wrist and scale-normalized (see
    detector.py's _normalize_hand), so flipping x is a valid "as if the
    other hand/orientation had signed it" augmentation — it roughly doubles
    single-hand training data for free, and helps the model generalize to
    left- and right-handed signers. This matters a lot more now than it did
    with 9 signs, since several letters differ from each other only in
    fairly subtle ways.

    Two-handed rows (e.g. HELP) are left untouched — mirroring those
    correctly would also need to swap which hand occupies the "first" slot,
    which is more than this needs to handle right now.
    """
    feature_cols = [c for c in df.columns if c != "label"]
    hand1_cols = feature_cols[:FEATURES_PER_HAND]
    hand2_cols = feature_cols[FEATURES_PER_HAND:2 * FEATURES_PER_HAND]

    is_single_hand = df[hand2_cols].abs().sum(axis=1) < 1e-6
    single_hand_df = df[is_single_hand]

    if single_hand_df.empty:
        return df

    mirrored = single_hand_df.copy()
    x_cols = hand1_cols[0::3]  # every 3rd column, starting at 0, is an x-coordinate
    mirrored[x_cols] = -mirrored[x_cols]

    augmented = pd.concat([df, mirrored], ignore_index=True)
    print(f"Mirror-augmented {len(mirrored)} single-hand samples "
          f"({len(df)} -> {len(augmented)} total).")
    return augmented


def main():
    parser = argparse.ArgumentParser(description="Train the ISL gesture classifier.")
    parser.add_argument("--cv", type=int, default=5,
                         help="Cross-validation folds used for the reported accuracy (default 5).")
    parser.add_argument("--n-estimators", type=int, default=600,
                         help="Trees in the forest (default 600, up from 400 — more classes "
                              "benefit from more trees).")
    parser.add_argument("--no-augment", action="store_true",
                         help="Skip the mirror-image augmentation for single-hand signs.")
    args = parser.parse_args()

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
    counts = df["label"].value_counts()
    print(counts)

    low = counts[counts < MIN_RECOMMENDED_SAMPLES]
    if not low.empty:
        print(f"\n⚠️  Below the recommended {MIN_RECOMMENDED_SAMPLES} samples — the report "
              "below will likely be unreliable for these until you collect more:")
        for sign, n in low.items():
            print(f"   {sign}: {n}")
        print()

    if not args.no_augment:
        df = mirror_augment(df)

    X = df.drop("label", axis=1)
    y = df["label"]

    model = RandomForestClassifier(
        n_estimators=args.n_estimators,
        min_samples_leaf=2,
        class_weight="balanced",  # matters more now that some signs will have fewer samples than others
        random_state=42,
        n_jobs=-1,
    )

    # A single train/test split gets noisy once you have 31 classes and some
    # of them are close to the MIN_RECOMMENDED_SAMPLES floor — a bad split
    # could leave a class with almost nothing in the test fold. Stratified
    # k-fold cross-validation gives a much steadier accuracy estimate.
    print(f"Running {args.cv}-fold stratified cross-validation...")
    skf = StratifiedKFold(n_splits=args.cv, shuffle=True, random_state=42)
    y_pred_cv = cross_val_predict(model, X, y, cv=skf, n_jobs=-1)
    print(classification_report(y, y_pred_cv))

    # The cross-validation above is purely to measure how good the model
    # likely is; the model that actually gets saved and served is fit on
    # ALL available data, since more data only helps at inference time.
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()