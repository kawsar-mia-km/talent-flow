FROM python:3.14-slim

# System deps needed by opencv/mediapipe/librosa
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsm6 libxext6 libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
