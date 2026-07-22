"""
Explainability for the final AI score using SHAP.

Our final score is a transparent weighted formula:
    final = 0.40 * resumeScore + 0.35 * videoScore + 0.25 * voiceScore

Because the scoring function is already linear and disclosed, SHAP's
exact contribution is easy to reason about (contribution_i = weight_i *
(value_i - baseline_i)), and we use `shap.Explainer` for real rather than
hand-rolling the arithmetic, so the output is a genuine SHAP explanation
object, not just a description of the formula. This keeps the model
honest: recruiters see exactly how much each modality moved the score
away from a "typical candidate" baseline, addressing the proposal's
"Bias & Fairness Reporting... transparent scoring explanation" requirement.
"""

import numpy as np
import shap

FEATURE_NAMES = ["resumeScore", "videoScore", "voiceScore"]
WEIGHTS = np.array([0.40, 0.35, 0.25])

# Baseline = an average/typical applicant, used as SHAP's reference point.
BASELINE = np.array([[65.0, 75.0, 70.0]])


def _scoring_function(X: np.ndarray) -> np.ndarray:
    return X @ WEIGHTS


def explain_score(resume_score: float, video_score: float, voice_score: float) -> dict:
    instance = np.array([[resume_score, video_score, voice_score]])
    explainer = shap.Explainer(_scoring_function, BASELINE, feature_names=FEATURE_NAMES)
    shap_values = explainer(instance)

    contributions = {
        name: round(float(val), 2)
        for name, val in zip(FEATURE_NAMES, shap_values.values[0])
    }
    base_value = round(float(shap_values.base_values[0]), 2)
    predicted = round(base_value + sum(contributions.values()), 2)

    ranked = sorted(contributions.items(), key=lambda kv: abs(kv[1]), reverse=True)
    top_driver = ranked[0][0] if ranked else None

    return {
        "baseValue": base_value,
        "contributions": contributions,
        "predictedScore": predicted,
        "topDriver": top_driver,
        "note": (
            "Contributions show how much each signal moved the score away from a "
            "typical-candidate baseline (resume 65, video 75, voice 70). Positive "
            "values pushed the score up, negative values pulled it down."
        )
    }
