# Single source of truth for sign labels.
# Every script (data collection, training, prediction) imports this list
# so they can never drift out of sync with each other.

WORDS = ["HELLO", "THANK_YOU", "WATER", "HELP", "PLEASE"]
LETTERS = [chr(c) for c in range(ord("A"), ord("Z") + 1)]  # A-Z, all 26

SIGNS = WORDS + LETTERS
