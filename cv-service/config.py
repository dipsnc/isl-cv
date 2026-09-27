# Single source of truth for sign labels.
# Every script (data collection, training, prediction) imports this list
# so they can never drift out of sync with each other.

SIGNS = ["HELLO", "THANK_YOU", "WATER", "HELP", "PLEASE", "A", "B", "C", "D"]
