import os
import sys
import csv
import argparse
import random
# pyrefly: ignore [missing-import]
import cv2

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from config import SIGNS          # noqa: E402
from detector import HandDetector  # noqa: E402

RAW_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset", "raw_images")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset", "landmarks_images.csv")
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")

# Below this many extracted samples for a sign, train_model.py's report is
# likely to be noisy for that class — flagged at the end of this script too,
# so you catch it before spending time training.
MIN_RECOMMENDED_SAMPLES = 150


def find_sign_folder(source_dir, sign):
    """
    Looks for a subfolder of source_dir matching `sign`, case-insensitively,
    so config.py's "A" matches a folder named "A" or "a" without renaming
    anything in the external dataset.
    """
    if not os.path.isdir(source_dir):
        return None
    for entry in os.listdir(source_dir):
        full_path = os.path.join(source_dir, entry)
        if os.path.isdir(full_path) and entry.lower() == sign.lower():
            return full_path
    return None


def main():
    parser = argparse.ArgumentParser(
        description="Extract MediaPipe landmarks from images into a training CSV."
    )
    parser.add_argument(
        "--source", action="append", default=None,
        help="A folder containing one subfolder per sign (e.g. an external "
             "dataset's 'Training' folder with A/, B/, C/... inside it). "
             "Can be passed multiple times. dataset/raw_images is always "
             "included automatically."
    )
    parser.add_argument(
        "--max-per-sign", type=int, default=400,
        help="Max images to read per sign, per source folder (keeps big "
             "external datasets quick to process). 0 = no limit. Raised "
             "from the old default of 300 now that letter classes benefit "
             "from more examples than the word signs did."
    )
    parser.add_argument(
        "--no-balance", action="store_true",
        help="Skip balancing: by default, every sign is trimmed down to "
             "match whichever sign has the fewest images, so no sign "
             "dominates the training set just because its source folder "
             "happened to have more photos."
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed used when shuffling images before balancing/trimming."
    )
    args = parser.parse_args()
    random.seed(args.seed)

    source_dirs = list(args.source) if args.source else []
    source_dirs.append(RAW_IMAGES_DIR)

    print("Checking source folders:")
    for source_dir in source_dirs:
        exists = os.path.isdir(source_dir)
        print(f"  {os.path.abspath(source_dir)}  (exists: {exists})")
        if exists:
            contents = os.listdir(source_dir)
            print(f"    contains: {contents[:15]}{' ...' if len(contents) > 15 else ''}")
    print()

    detector = HandDetector(static_image_mode=True)
    rows = []
    skipped = 0
    extracted_per_sign = {sign: 0 for sign in SIGNS}

    # First pass: gather every candidate image path per sign, without
    # processing them yet, so we know the counts before deciding how many
    # to actually use from each.
    images_by_sign = {}
    for sign in SIGNS:
        images_for_sign = []
        for source_dir in source_dirs:
            folder = find_sign_folder(source_dir, sign)
            if not folder:
                continue
            files = [os.path.join(folder, f) for f in os.listdir(folder)
                     if f.lower().endswith(IMAGE_EXTENSIONS)]
            if args.max_per_sign > 0:
                files = files[:args.max_per_sign]
            images_for_sign.extend(files)
        images_by_sign[sign] = images_for_sign

    print("Images found per sign (before balancing):")
    for sign, files in images_by_sign.items():
        print(f"  {sign}: {len(files)}")

    if not args.no_balance:
        nonzero_counts = [len(files) for files in images_by_sign.values() if files]
        if nonzero_counts:
            target = min(nonzero_counts)
            print(f"\nBalancing: trimming every sign down to {target} images "
                  f"(shuffled first, seed={args.seed}).")
            for sign, files in images_by_sign.items():
                random.shuffle(files)
                images_by_sign[sign] = files[:target]

    print()
    for sign, images_for_sign in images_by_sign.items():
        print(f"Processing {len(images_for_sign)} images for {sign}...")

        for path in images_for_sign:
            frame = cv2.imread(path)
            if frame is None:
                skipped += 1
                continue

            landmarks, _ = detector.find_landmarks(frame)
            if landmarks is None:
                skipped += 1
                continue

            rows.append(landmarks + [sign])
            extracted_per_sign[sign] += 1

    detector.close()

    if not rows:
        print("No landmarks extracted. Check your --source folder(s) and dataset/raw_images/<SIGN>/.")
        return

    with open(CSV_PATH, "w", newline="") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow([f"c{i}" for i in range(126)] + ["label"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} samples to {CSV_PATH} ({skipped} images skipped, no hand found)")

    low = {s: n for s, n in extracted_per_sign.items() if 0 < n < MIN_RECOMMENDED_SAMPLES}
    missing = [s for s, n in extracted_per_sign.items() if n == 0]
    if low:
        print(f"\n⚠️  Below the recommended {MIN_RECOMMENDED_SAMPLES} samples after extraction:")
        for sign, n in sorted(low.items(), key=lambda kv: kv[1]):
            print(f"   {sign}: {n}")
    if missing:
        print("\n⚠️  No usable images found at all for:", ", ".join(missing))


if __name__ == "__main__":
    main()