# pyrefly: ignore [missing-import]
import cv2
import csv
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from config import SIGNS          # noqa: E402
from detector import HandDetector  # noqa: E402

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
CSV_PATH = os.path.join(DATASET_DIR, "landmarks.csv")

# Rough target per sign for the on-screen counter to track against. See
# cv-service/README.md for why this is higher than the old 150-250 guidance
# now that several signs (the letters) look a lot more like each other than
# HELLO/WATER/HELP ever did.
TARGET_SAMPLES = 300


def load_existing_counts():
    """
    Read counts back out of any existing CSV so the on-screen totals stay
    accurate across sessions — collecting 300+ samples for each of 31 signs
    in one sitting isn't realistic, and the old version reset to 0 every run.
    """
    counts = {sign: 0 for sign in SIGNS}
    if os.path.isfile(CSV_PATH):
        with open(CSV_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row.get("label")
                if label in counts:
                    counts[label] += 1
    return counts


def main():
    os.makedirs(DATASET_DIR, exist_ok=True)

    detector = HandDetector()
    cap = cv2.VideoCapture(0)

    current_label_index = 0
    recording = False
    samples_collected = load_existing_counts()

    file_exists = os.path.isfile(CSV_PATH)
    csv_file = open(CSV_PATH, "a", newline="")
    writer = csv.writer(csv_file)
    if not file_exists:
        header = [f"c{i}" for i in range(126)] + ["label"]  # 2 hands x 63 features
        writer.writerow(header)

    def jump_to_weakest():
        nonlocal current_label_index
        current_label_index = min(range(len(SIGNS)), key=lambda i: samples_collected[SIGNS[i]])

    print("Controls:")
    print("  SPACE     : start/stop recording frames for the selected sign")
    print("  ] or n    : next sign")
    print("  [ or p    : previous sign")
    print("  a         : jump to whichever sign has the fewest samples so far")
    print("  0-9       : jump directly to signs 0-9 (kept for backward compat)")
    print("  q         : quit")
    print(f"\n{len(SIGNS)} signs loaded, target ~{TARGET_SAMPLES} samples each:")
    for i, sign in enumerate(SIGNS):
        print(f"  {i}: {sign} ({samples_collected[sign]} so far)")

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        landmarks, hand_landmarks = detector.find_landmarks(frame)

        if hand_landmarks:
            frame = detector.draw_landmarks(frame, hand_landmarks)

        current_sign = SIGNS[current_label_index]

        if recording and landmarks:
            writer.writerow(landmarks + [current_sign])
            samples_collected[current_sign] += 1

        status = "RECORDING" if recording else "PAUSED"
        signs_at_target = sum(1 for s in SIGNS if samples_collected[s] >= TARGET_SAMPLES)

        cv2.putText(frame, f"[{current_label_index + 1}/{len(SIGNS)}] {current_sign} | {status}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(frame, f"Samples: {samples_collected[current_sign]} / {TARGET_SAMPLES}",
                    (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(frame, f"At target: {signs_at_target}/{len(SIGNS)}  |  ] next  [ prev  a: weakest",
                    (10, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)

        cv2.imshow("Collect ISL Landmarks", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord(" "):
            recording = not recording
        elif key in (ord("]"), ord("n")):
            current_label_index = (current_label_index + 1) % len(SIGNS)
            recording = False
        elif key in (ord("["), ord("p")):
            current_label_index = (current_label_index - 1) % len(SIGNS)
            recording = False
        elif key == ord("a"):
            jump_to_weakest()
            recording = False
        elif chr(key).isdigit() and int(chr(key)) < len(SIGNS):
            current_label_index = int(chr(key))
            recording = False

    csv_file.close()
    cap.release()
    cv2.destroyAllWindows()
    print("Done. Samples collected:", samples_collected)


if __name__ == "__main__":
    main()