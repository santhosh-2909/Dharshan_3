# Aalayam — Single-stage Docker build
# Frontend is pre-built static HTML/CSS/JS in dist/, no Node.js needed.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app

# Install dependencies
COPY temple/backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy backend + frontend
COPY temple/backend /app/temple/backend
COPY temple/frontend/dist /app/temple/frontend/dist

EXPOSE 10000

CMD ["sh", "-c", "cd /app/temple/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
