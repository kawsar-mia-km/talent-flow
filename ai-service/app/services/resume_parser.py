"""
Real resume parsing: extracts text from an uploaded PDF/DOCX, then uses
spaCy's PhraseMatcher against a skill taxonomy (fast, precise skill
matching) plus spaCy's built-in NER to pull out organizations and dates,
which we use to estimate years of experience.
"""

import io
import re
from datetime import datetime

import pdfplumber
import spacy
from docx import Document
from spacy.matcher import PhraseMatcher

from app.skills_taxonomy import SKILL_TAXONOMY

_nlp = None
_matcher = None


def get_nlp():
    """Lazy-load the spaCy model once per process (it's slow to load)."""
    global _nlp, _matcher
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError as exc:
            raise RuntimeError(
                "spaCy model 'en_core_web_sm' is not installed. Run: "
                "python -m spacy download en_core_web_sm"
            ) from exc
        _matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")
        patterns = [_nlp.make_doc(skill) for skill in SKILL_TAXONOMY]
        _matcher.add("SKILLS", patterns)
    return _nlp, _matcher


def extract_text(file_bytes: bytes, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        return "\n".join(text_parts)
    if lower.endswith(".docx"):
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)
    # Fallback: treat as plain text
    return file_bytes.decode("utf-8", errors="ignore")


def estimate_years_experience(text: str) -> float:
    """
    Heuristic: find 4-digit year ranges like '2019 - 2023' or '2019-present'
    in the text and sum up the spans. This is a common, honest approximation
    used by many resume parsers when structured work-history fields aren't
    available; it is not perfect but is transparent about how it works.
    """
    current_year = datetime.now().year
    ranges = re.findall(
        r"(19|20)\d{2}\s*[-–—to]+\s*((19|20)\d{2}|present|current)",
        text,
        flags=re.IGNORECASE,
    )
    total_years = 0.0
    matches = re.finditer(
        r"((19|20)\d{2})\s*[-–—]+\s*((19|20)\d{2}|present|current)",
        text,
        flags=re.IGNORECASE,
    )
    spans = []
    for m in matches:
        start_year = int(m.group(1))
        end_raw = m.group(3)
        end_year = current_year if end_raw.lower() in ("present", "current") else int(end_raw)
        if 1990 <= start_year <= current_year and start_year <= end_year:
            spans.append((start_year, end_year))

    if not spans:
        return 0.0

    # Merge overlapping ranges so overlapping jobs aren't double-counted
    spans.sort()
    merged = [spans[0]]
    for start, end in spans[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))

    total_years = sum(end - start for start, end in merged)
    return round(total_years, 1)


def parse_resume(file_bytes: bytes, filename: str) -> dict:
    nlp, matcher = get_nlp()
    text = extract_text(file_bytes, filename)
    if not text.strip():
        return {
            "skills": [],
            "organizations": [],
            "estimatedYearsExperience": 0.0,
            "rawTextLength": 0,
            "warning": "No extractable text found in this file (it may be a scanned image)."
        }

    doc = nlp(text)

    matches = matcher(doc)
    found_skills = sorted({doc[start:end].text for _, start, end in matches}, key=str.lower)

    organizations = sorted({ent.text for ent in doc.ents if ent.label_ == "ORG"})[:15]

    return {
        "skills": found_skills,
        "organizations": organizations,
        "estimatedYearsExperience": estimate_years_experience(text),
        "rawTextLength": len(text)
    }
