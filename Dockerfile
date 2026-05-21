# ==========================================
# STAGE 1: Frontend Static Assets Builder
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy package manifests
COPY frontend/package*.json ./

# Install npm dependencies
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Compile TailwindCSS and compile SPA bundles
RUN npm run build

# ==========================================
# STAGE 2: FastAPI Operational Runner
# ==========================================
FROM python:3.11-slim AS backend-runner

WORKDIR /app

# Set production env flags
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ /app/backend/

# Copy compiled frontend assets from Stage 1 into the correct relative position
COPY --from=frontend-builder /frontend/dist /app/frontend/dist/

# Copy MySQL legacy seed file for auto-ETL checks
COPY sensores_normalizado_mysql.sql /app/sensores_normalizado_mysql.sql

# Expose production port
EXPOSE 8000

# Uvicorn boot command
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
