FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install -i https://mirrors.cloud.tencent.com/pypi/simple --no-cache-dir --default-timeout=1000 -r requirements.txt python-dotenv fastapi-limiter sentry-sdk prometheus-fastapi-instrumentator replicate requests python-jose[cryptography]
COPY . .
ENV NODE_ENV=production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
