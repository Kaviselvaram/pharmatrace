# Backend Dockerfile - FastAPI + Web3 + Physics Simulation
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 -r requirements.txt

# Copy backend source code
COPY backend/ /app/backend/

# Copy contract deployment artifacts
COPY contracts/deployments /app/contracts/deployments

ENV PYTHONPATH=/app/backend
ENV RPC_URL=http://blockchain:8545
ENV DATABASE_URL=sqlite+aiosqlite:////app/backend/infosecproj.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
