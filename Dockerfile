FROM node:24-alpine AS frontend-builder

WORKDIR /app/temple/frontend

COPY temple/frontend/package.json temple/frontend/package-lock.json ./
RUN npm ci

COPY temple/frontend/ ./
RUN npm run build


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app

COPY temple/backend/requirements.txt /tmp/requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r /tmp/requirements.txt

COPY temple/backend /app/temple/backend
COPY --from=frontend-builder /app/temple/frontend/dist /app/temple/frontend/dist

EXPOSE 10000

CMD ["sh", "-c", "cd /app/temple/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
