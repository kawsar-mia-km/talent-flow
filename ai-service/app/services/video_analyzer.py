"""
Real video analysis using MediaPipe FaceMesh landmarks + OpenCV frame
sampling.

IMPORTANT HONESTY NOTE (read before wiring this into a hiring decision):
Facial-expression-based "confidence" or "emotion" scoring is scientifically
contested — psychological research does not support reliably inferring
internal states (confidence, honesty, competence) from facial movements
alone, and these systems have documented accuracy gaps across skin tone,
gender, age and disability. What this module actually measures are
low-level, literal signals: whether a face is detected/visible on camera,
how much the head moves frame-to-frame, and how much the mouth/eyes open
and close. Treat the output as descriptive engagement signals, not as a
validated measurement of confidence, competence, or honesty, and never as
the sole basis for a hiring decision. Surface it to recruiters as
supporting context, and pair it with the fairness-report endpoint so
score disparities across groups can be audited.
"""

import cv2
import numpy as np
import mediapipe as mp
import tempfile
import os

mp_face_mesh = mp.solutions.face_mesh

# Landmark indices we use (MediaPipe FaceMesh 468-point topology)
NOSE_TIP = 1
LEFT_EYE_TOP, LEFT_EYE_BOTTOM = 159, 145
RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM = 386, 374
MOUTH_TOP, MOUTH_BOTTOM = 13, 14
MOUTH_LEFT, MOUTH_RIGHT = 61, 291


def _sample_frames(video_path: str, max_frames: int = 40):
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    if total <= 0:
        cap.release()
        return []

    step = max(1, total // max_frames)
    frames = []
    idx = 0
    while cap.isOpened() and len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % step == 0:
            frames.append(frame)
        idx += 1
    cap.release()
    return frames


def analyze_video(file_bytes: bytes, filename: str) -> dict:
    suffix = os.path.splitext(filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        frames = _sample_frames(tmp_path)
        if not frames:
            return {
                "faceDetectionRate": 0,
                "headStabilityScore": 0,
                "expressivenessScore": 0,
                "eyeOpennessScore": 0,
                "confidenceScore": 0,
                "postureScore": 0,
                "framesAnalyzed": 0,
                "warning": "Could not read any frames from this video file."
            }

        nose_positions = []
        eye_openness_values = []
        mouth_openness_values = []
        faces_detected = 0

        with mp_face_mesh.FaceMesh(
            static_image_mode=True, max_num_faces=1, refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face_mesh:
            for frame in frames:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                h, w = frame.shape[:2]
                result = face_mesh.process(rgb)
                if not result.multi_face_landmarks:
                    continue
                faces_detected += 1
                lm = result.multi_face_landmarks[0].landmark

                nose_positions.append((lm[NOSE_TIP].x * w, lm[NOSE_TIP].y * h))

                left_eye_gap = abs(lm[LEFT_EYE_TOP].y - lm[LEFT_EYE_BOTTOM].y) * h
                right_eye_gap = abs(lm[RIGHT_EYE_TOP].y - lm[RIGHT_EYE_BOTTOM].y) * h
                eye_openness_values.append((left_eye_gap + right_eye_gap) / 2)

                mouth_gap = abs(lm[MOUTH_TOP].y - lm[MOUTH_BOTTOM].y) * h
                mouth_width = abs(lm[MOUTH_LEFT].x - lm[MOUTH_RIGHT].x) * w
                mouth_openness_values.append(mouth_gap / (mouth_width + 1e-6))

        frames_analyzed = len(frames)
        face_detection_rate = round((faces_detected / frames_analyzed) * 100, 1) if frames_analyzed else 0

        if len(nose_positions) >= 2:
            arr = np.array(nose_positions)
            movement = np.linalg.norm(np.diff(arr, axis=0), axis=1)
            avg_movement = float(np.mean(movement))
            # Normalize: smaller frame-to-frame movement -> higher stability.
            # 15px average jitter is treated as the "very stable" reference point.
            head_stability_score = round(max(0, min(100, 100 - avg_movement * 4)), 1)
        else:
            head_stability_score = 0

        expressiveness_score = round(min(100, float(np.std(mouth_openness_values)) * 900), 1) if mouth_openness_values else 0
        eye_openness_score = round(min(100, float(np.mean(eye_openness_values)) * 12), 1) if eye_openness_values else 0

        # Composite proxies — deliberately simple, documented weights so
        # recruiters can see exactly how each number was built.
        confidence_score = round(
            face_detection_rate * 0.4 + head_stability_score * 0.35 + eye_openness_score * 0.25, 1
        )
        posture_score = round(head_stability_score * 0.7 + face_detection_rate * 0.3, 1)

        return {
            "faceDetectionRate": face_detection_rate,
            "headStabilityScore": head_stability_score,
            "expressivenessScore": expressiveness_score,
            "eyeOpennessScore": eye_openness_score,
            "confidenceScore": confidence_score,
            "postureScore": posture_score,
            "framesAnalyzed": frames_analyzed
        }
    finally:
        os.unlink(tmp_path)
