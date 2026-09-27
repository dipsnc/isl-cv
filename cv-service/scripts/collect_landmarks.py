import cv2
import csv
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from config import SIGNS          # noqa: E402
from detector import HandDetector  # noqa: E402

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
CSV_PATH = os.path.join(DATASET_DIR, "landmarks.csv")


def main():
    os.makedirs(DATASET_DIR, exist_ok=True)

    detector = HandDetector()
    cap = cv2.VideoCapture(0)

    current_label_index = 0
    recording = False
    samples_collected = {sign: 0 for sign in SIGNS}

    file_exists = os.path.isfile(CSV_PATH)
    csv_file = open(CSV_PATH, "a", newline="")
    writer = csv.writer(csv_file)
    if not file_exists:
        header = [f"c{i}" for i in range(126)] + ["label"]  # 2 hands x 63 features
        writer.writerow(header)

    print("Controls:")
    print("  0-4  : select which sign you're about to record")
    print("  SPACE: start/stop recording frames for the selected sign")
    print("  q    : quit")
    for i, sign in enumerate(SIGNS):
        print(f"  {i}: {sign}")

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        landmarks, hand_landmarks = detector.find_landmarks(frame)

        if hand_landmarks:
            frame = detector.draw_landmarks(frame, hand_landmarks)

        if recording and landmarks:
            writer.writerow(landmarks + [SIGNS[current_label_index]])
            samples_collected[SIGNS[current_label_index]] += 1

        status = "RECORDING" if recording else "PAUSED"
        cv2.putText(frame, f"Sign: {SIGNS[current_label_index]} | {status}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(frame, f"Samples: {samples_collected[SIGNS[current_label_index]]}",
                    (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

        cv2.imshow("Collect ISL Landmarks", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord(" "):
            recording = not recording
        elif chr(key).isdigit() and int(chr(key)) < len(SIGNS):
            current_label_index = int(chr(key))
            recording = False

    csv_file.close()
    cap.release()
    cv2.destroyAllWindows()
    print("Done. Samples collected:", samples_collected)


if __name__ == "__main__":
    main()
