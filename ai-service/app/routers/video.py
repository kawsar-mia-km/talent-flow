from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.video_analyzer import analyze_video

router = APIRouter(prefix="/video", tags=["video"])


@router.post("/analyze")
async def analyze_video_endpoint(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".mp4", ".mov", ".webm", ".avi")):
        raise HTTPException(400, "Please upload an MP4, MOV, WEBM, or AVI video.")
    try:
        content = await file.read()
        result = analyze_video(content, file.filename)
        return result
    except Exception as exc:
        raise HTTPException(500, f"Video analysis failed: {exc}")
