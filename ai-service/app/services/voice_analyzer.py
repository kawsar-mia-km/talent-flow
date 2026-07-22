"""
Real voice analysis: transcribes speech with OpenAI's Whisper model, then
extracts acoustic features with librosa (pitch, energy, speaking rate,
pause ratio) to build tone/stress/clarity proxy scores.

HONESTY NOTE: "stress" and "tone" here are acoustic proxies (pitch
variability, energy variability, pause frequency) — well-established
signal-processing measurements — not a clinical or psychological stress
diagnosis. Vocal pitch and pacing vary a great deal by language, accent,
culture and individual speaking style, so these scores can carry the same
kind of bias risk called out in the project proposal's "Ethical and bias
concerns... particularly regarding language, accent, and cultural
differences." Surface confidence intervals or raw features alongside the
score where possible, and always allow a human recruiter to listen to the
original recording rather than relying on the score alone.
"""

import tempfile
import os
import numpy as np
import librosa
import whisper

_whisper_model = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        # "base" balances speed and accuracy for short interview clips.
        # Use "small" or "medium" for higher accuracy if you have the GPU/CPU budget.
        _whisper_model = whisper.load_model("base")
    return _whisper_model


def analyze_voice(file_bytes: bytes, filename: str) -> dict:
    suffix = os.path.splitext(filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        model = get_whisper_model()
        transcription = model.transcribe(tmp_path, fp16=False)
        transcript_text = transcription.get("text", "").strip()
        word_count = len(transcript_text.split())

        y, sr = librosa.load(tmp_path, sr=16000, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)

        # Pitch (F0) via the YIN algorithm
        f0 = librosa.yin(y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7"))
        f0_voiced = f0[~np.isnan(f0)]
        pitch_mean = float(np.mean(f0_voiced)) if len(f0_voiced) else 0.0
        pitch_std = float(np.std(f0_voiced)) if len(f0_voiced) else 0.0

        # Energy / loudness variability (RMS)
        rms = librosa.feature.rms(y=y)[0]
        energy_std = float(np.std(rms))

        # Pause ratio: fraction of frames below a low-energy threshold
        silence_threshold = np.percentile(rms, 20)
        pause_ratio = float(np.mean(rms < silence_threshold))

        speaking_rate_wpm = round((word_count / duration) * 60, 1) if duration > 0 else 0

        # Tone steadiness: lower pitch variability relative to mean -> steadier tone.
        # Guard against divide-by-zero for near-silent clips.
        pitch_cv = (pitch_std / pitch_mean) if pitch_mean > 1e-6 else 1.0
        tone_score = round(max(0, min(100, 100 - pitch_cv * 120)), 1)

        # Stress proxy: more energy variability + more pausing -> higher proxy stress.
        stress_proxy = round(max(0, min(100, energy_std * 800 + pause_ratio * 60)), 1)

        # Clarity proxy: a moderate, steady speaking rate (~110-160 wpm) scores highest.
        if speaking_rate_wpm == 0:
            clarity_score = 0
        else:
            distance_from_ideal = min(abs(speaking_rate_wpm - 135), 100)
            clarity_score = round(max(0, 100 - distance_from_ideal), 1)

        voice_score = round(tone_score * 0.4 + clarity_score * 0.35 + (100 - stress_proxy) * 0.25, 1)

        return {
            "transcript": transcript_text,
            "wordCount": word_count,
            "durationSeconds": round(duration, 1),
            "speakingRateWpm": speaking_rate_wpm,
            "pitchMeanHz": round(pitch_mean, 1),
            "toneScore": tone_score,
            "stressProxyScore": stress_proxy,
            "clarityScore": clarity_score,
            "voiceScore": voice_score
        }
    finally:
        os.unlink(tmp_path)
