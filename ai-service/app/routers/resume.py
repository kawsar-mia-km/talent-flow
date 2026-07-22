from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(400, "Please upload a PDF, DOCX, or TXT resume.")
    try:
        content = await file.read()
        result = parse_resume(content, file.filename)
        return result
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
