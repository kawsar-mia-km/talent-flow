from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import resume, video, voice, analysis

app = FastAPI(
    title="TalentFlow AI Service",
    description="Real resume parsing, video/voice analysis, explainability and fairness auditing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your Node server's URL in production
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(resume.router)
app.include_router(video.router)
app.include_router(voice.router)
app.include_router(analysis.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "TalentFlow AI Service"}
