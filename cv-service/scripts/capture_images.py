import cv2
import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from config import SIGNS  # noqa: E402

RAW_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset", "raw_images")


def main():
    for sign in SIGNS:
        os.makedirs(os.path.join(RAW_IMAGES_DIR, sign), exist_ok=True)

    cap = cv2.VideoCapture(0)
    current_label_index = 0

    print("Controls:")
    print("  0-9 : select which sign you're about to photograph")
    print("  c   : capture ONE photo for the selected sign")
    print("  q   : quit")
    for i, sign in enumerate(SIGNS):
        print(f"  {i}: {sign}")

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        display = frame.copy()

        sign = SIGNS[current_label_index]
        folder = os.path.join(RAW_IMAGES_DIR, sign)
        existing_count = len([f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".png"))])

        cv2.putText(display, f"Sign: {sign}  (saved so far: {existing_count})",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(display, "c = capture | 0-9 = switch sign | q = quit",
                    (10, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

        cv2.imshow("Capture ISL Images", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("c"):
            filename = f"{sign}_{int(time.time() * 1000)}.jpg"
            path = os.path.join(folder, filename)
            cv2.imwrite(path, frame)
            print(f"Saved {path}")
        elif chr(key).isdigit() and int(chr(key)) < len(SIGNS):
            current_label_index = int(chr(key))

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
