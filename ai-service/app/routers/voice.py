from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.voice_analyzer import analyze_voice

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/analyze")
async def analyze_voice_endpoint(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".mp3", ".wav", ".m4a", ".webm", ".ogg")):
        raise HTTPException(400, "Please upload an MP3, WAV, M4A, WEBM, or OGG audio file.")
    try:
        content = await file.read()
        result = analyze_voice(content, file.filename)
        return result
    except Exception as exc:
        raise HTTPException(500, f"Voice analysis failed: {exc}")
