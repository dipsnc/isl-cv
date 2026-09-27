import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "isl_model.pkl")


class GesturePredictor:
    def __init__(self, model_path=MODEL_PATH):
        if not os.path.isfile(model_path):
            raise FileNotFoundError(
                f"No trained model at {model_path}. Run scripts/train_model.py first."
            )
        self.model = joblib.load(model_path)

    def predict(self, landmarks_flat):
        """
        landmarks_flat: list/array of 63 floats (same format detector.py produces).
        Returns (predicted_label, confidence)
        """
        X = np.array(landmarks_flat).reshape(1, -1)
        probabilities = self.model.predict_proba(X)[0]
        classes = self.model.classes_

        best_index = np.argmax(probabilities)
        return classes[best_index], float(probabilities[best_index])
