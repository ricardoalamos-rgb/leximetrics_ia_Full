FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema (ffmpeg para TTS + Playwright)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxkbcommon0 \
    libxrandr2 \
    libxdamage1 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Playwright browsers (Chromium)
RUN playwright install chromium

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8004}"]
