# pyrefly: ignore [missing-import]
import cv2
import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from config import SIGNS  # noqa: E402

RAW_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset", "raw_images")
TARGET_IMAGES = 300


def main():
    for sign in SIGNS:
        os.makedirs(os.path.join(RAW_IMAGES_DIR, sign), exist_ok=True)

    cap = cv2.VideoCapture(0)
    current_label_index = 0

    def count_for(sign):
        folder = os.path.join(RAW_IMAGES_DIR, sign)
        return len([f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".jpeg", ".png"))])

    def jump_to_weakest():
        nonlocal current_label_index
        current_label_index = min(range(len(SIGNS)), key=lambda i: count_for(SIGNS[i]))

    print("Controls:")
    print("  c         : capture ONE photo for the selected sign")
    print("  ] or n    : next sign")
    print("  [ or p    : previous sign")
    print("  a         : jump to whichever sign has the fewest photos so far")
    print("  0-9       : jump directly to signs 0-9 (kept for backward compat)")
    print("  q         : quit")
    for i, sign in enumerate(SIGNS):
        print(f"  {i}: {sign} ({count_for(sign)} so far)")

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        display = frame.copy()

        sign = SIGNS[current_label_index]
        existing_count = count_for(sign)

        cv2.putText(display, f"[{current_label_index + 1}/{len(SIGNS)}] {sign}  (saved: {existing_count}/{TARGET_IMAGES})",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(display, "c: capture | ] next | [ prev | a: weakest | q: quit",
                    (10, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

        cv2.imshow("Capture ISL Images", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("c"):
            filename = f"{sign}_{int(time.time() * 1000)}.jpg"
            path = os.path.join(RAW_IMAGES_DIR, sign, filename)
            cv2.imwrite(path, frame)
            print(f"Saved {path}")
        elif key in (ord("]"), ord("n")):
            current_label_index = (current_label_index + 1) % len(SIGNS)
        elif key in (ord("["), ord("p")):
            current_label_index = (current_label_index - 1) % len(SIGNS)
        elif key == ord("a"):
            jump_to_weakest()
        elif chr(key).isdigit() and int(chr(key)) < len(SIGNS):
            current_label_index = int(chr(key))

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()