# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import mediapipe as mp

NUM_HANDS = 2
FEATURES_PER_HAND = 63  # 21 landmarks x (x, y, z)


class HandDetector:
    """
    Thin wrapper around MediaPipe Hands.
    Used by BOTH collect_landmarks.py (training data) and main.py (live prediction)
    so the landmarks are always extracted the exact same way.

    Tracks up to two hands (needed for two-handed signs like HELP).
    """

    def __init__(self, max_hands=NUM_HANDS, detection_confidence=0.7, tracking_confidence=0.7,
                 static_image_mode=False):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_hands,
            min_detection_confidence=detection_confidence,
            min_tracking_confidence=tracking_confidence,
        )
        self.mp_draw = mp.solutions.drawing_utils

    @staticmethod
    def _normalize_hand(raw_landmarks):
        """
        raw_landmarks: flat list of 63 floats (one hand, MediaPipe's raw
        image-relative x,y,z). Returns a new flat list that is invariant to
        where the hand sits in the frame and how big it appears (distance
        from camera): the wrist becomes the origin, and everything is scaled
        by the wrist-to-middle-finger-knuckle distance. This is what lets a
        webcam frame and a photo from a completely different dataset produce
        comparable features for the same hand shape.
        """
        points = [raw_landmarks[i:i + 3] for i in range(0, len(raw_landmarks), 3)]
        wrist = points[0]
        translated = [[p[0] - wrist[0], p[1] - wrist[1], p[2] - wrist[2]] for p in points]

        ref = translated[9]  # middle finger MCP joint
        scale = (ref[0] ** 2 + ref[1] ** 2 + ref[2] ** 2) ** 0.5
        if scale < 1e-6:
            scale = 1e-6

        normalized = []
        for p in translated:
            normalized.extend([p[0] / scale, p[1] / scale, p[2] / scale])
        return normalized

    def find_landmarks(self, frame_bgr):
        """
        frame_bgr: a frame as read by OpenCV (BGR color order).
        Returns (landmarks_flat, hand_landmarks_list) or (None, None) if no hand found.

        landmarks_flat is ALWAYS 126 numbers long (NUM_HANDS * 63), normalized
        per-hand (see _normalize_hand) so single-hand and two-hand signs, and
        images from any source (webcam or an external dataset), produce
        comparable feature vectors:
          - both hands detected  -> both hands' landmarks, sorted left-to-right
                                     by wrist x-position (for consistent ordering)
          - one hand detected    -> that hand's landmarks, then 63 zeros as filler
        The zero-padding is itself useful signal: it lets the model tell apart
        one-handed signs (e.g. HELLO) from two-handed ones (e.g. HELP).
        """
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)

        if not results.multi_hand_landmarks:
            return None, None

        hands_found = list(results.multi_hand_landmarks)
        # Sort left-to-right by RAW wrist x (before normalization erases position)
        # so feature order stays consistent frame-to-frame.
        hands_found = sorted(hands_found, key=lambda h: h.landmark[0].x)[:NUM_HANDS]

        landmarks_flat = []
        for hand_landmarks in hands_found:
            raw = []
            for lm in hand_landmarks.landmark:
                raw.extend([lm.x, lm.y, lm.z])
            landmarks_flat.extend(self._normalize_hand(raw))

        missing_hands = NUM_HANDS - len(hands_found)
        if missing_hands > 0:
            landmarks_flat.extend([0.0] * (FEATURES_PER_HAND * missing_hands))

        return landmarks_flat, hands_found

    def draw_landmarks(self, frame_bgr, hand_landmarks_list):
        for hand_landmarks in hand_landmarks_list:
            self.mp_draw.draw_landmarks(frame_bgr, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
        return frame_bgr

    def close(self):
        self.hands.close()