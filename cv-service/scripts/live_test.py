# pyrefly: ignore [missing-import]
import cv2
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from detector import HandDetector
from predictor import GesturePredictor

def main():
    detector = HandDetector()
    predictor = GesturePredictor()
    cap = cv2.VideoCapture(0)

    print("Move your hand(s) naturally, redo each sign from scratch, tilt/rotate,")
    print("change distance from the camera. Press 'q' to quit.")

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        landmarks, hands_found = detector.find_landmarks(frame)

        if hands_found:
            frame = detector.draw_landmarks(frame, hands_found)

        if landmarks:
            predicted_sign, confidence = predictor.predict(landmarks)
            text = f"{predicted_sign} ({confidence:.0%})"
            color = (0, 150, 0) if confidence > 0.7 else (0, 0, 200)
            cv2.putText(frame, text, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        else:
            cv2.putText(frame, "No hand detected", (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 200), 2)

        cv2.imshow("Live Test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
