"""
Fairness auditing using Fairlearn.

DELIBERATE DESIGN CHOICE: this service does NOT collect or store
protected characteristics (gender, ethnicity, age, disability, etc.)
inside TalentFlow itself. Collecting that data inside a scoring pipeline
creates real risk of it leaking into decisions, even unintentionally.
Instead, an admin who already holds properly-consented demographic data
through a separate, legally-compliant HR process (e.g. a voluntary EEO
self-identification survey routed straight to HR, never to recruiters)
can upload a small CSV of {applicationId, groupLabel} to audit the
model's *outcomes* for disparities, without TalentFlow ever seeing what
the group labels represent. Group results below a minimum size are
suppressed to avoid re-identifying individuals in small groups.

This computes selection-rate parity: for a given "selected" threshold
(e.g. finalScore >= 70 counts as shortlist-worthy), Fairlearn's
MetricFrame reports the selection rate per group and the demographic
parity difference (max group rate - min group rate). A large gap is a
signal for human review, not proof of discrimination on its own —
group composition, role fit, and small samples can also explain
differences.
"""

from fairlearn.metrics import MetricFrame, selection_rate, demographic_parity_difference
import pandas as pd

MIN_GROUP_SIZE = 5


def audit_fairness(records: list[dict], threshold: float = 70.0) -> dict:
    """
    records: list of {"applicationId": str, "finalScore": float, "groupLabel": str}
    """
    if not records:
        return {"error": "No records provided."}

    df = pd.DataFrame(records)
    if not {"finalScore", "groupLabel"}.issubset(df.columns):
        return {"error": "Each record needs finalScore and groupLabel fields."}

    group_counts = df["groupLabel"].value_counts()
    small_groups = group_counts[group_counts < MIN_GROUP_SIZE].index.tolist()
    df_filtered = df[~df["groupLabel"].isin(small_groups)]

    if df_filtered.empty or df_filtered["groupLabel"].nunique() < 2:
        return {
            "error": (
                f"Not enough data to audit fairly. Each group needs at least "
                f"{MIN_GROUP_SIZE} applications, and at least 2 groups are required."
            ),
            "suppressedGroups": small_groups
        }

    y_pred = (df_filtered["finalScore"] >= threshold).astype(int)
    sensitive = df_filtered["groupLabel"]

    frame = MetricFrame(
        metrics={"selectionRate": selection_rate, "count": lambda yt, yp: len(yp), "avgScore": lambda *_: None},
        y_true=y_pred,  # placeholder true labels; selection_rate only needs y_pred
        y_pred=y_pred,
        sensitive_features=sensitive
    )

    by_group = frame.by_group.copy()
    by_group["avgScore"] = df_filtered.groupby("groupLabel")["finalScore"].mean().round(1)
    by_group["selectionRate"] = (by_group["selectionRate"] * 100).round(1)

    parity_diff = round(demographic_parity_difference(y_pred, y_pred, sensitive_features=sensitive) * 100, 1)

    return {
        "threshold": threshold,
        "groups": by_group.reset_index().rename(columns={"groupLabel": "group"}).to_dict(orient="records"),
        "demographicParityDifferencePct": parity_diff,
        "suppressedGroups": small_groups,
        "note": (
            "Demographic parity difference is the gap (in percentage points) between the "
            "highest and lowest group selection rates. Values under ~10 are generally low "
            "concern; larger gaps warrant human review of the underlying scoring signals."
        )
    }
