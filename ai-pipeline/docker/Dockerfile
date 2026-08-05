# Runs the AI pipeline service. Built from the ai-pipeline/ directory,
# see docker-compose.yml for how this fits together with Redis and
# LibreTranslate for local development.

FROM python:3.11-slim

WORKDIR /app

# ffmpeg is required by faster-whisper to decode most audio formats.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
