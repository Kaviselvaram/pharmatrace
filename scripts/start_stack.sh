#!/usr/bin/env bash
# ==============================================================================
# PharmaTrace Orchestrated Stack Startup Script
# Boots Hardhat EVM (8546) -> Deploys Contracts -> Starts FastAPI (8001) -> Frontend (5174)
# CBS3002 Information Security Project - Kaviselvaram & Aniesh S
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "======================================================================"
echo "🚀 STARTING PHARMATRACE LOCAL FULL STACK"
echo "======================================================================"

# 1. Hardhat Local EVM (port 8546)
if lsof -i :8546 >/dev/null 2>&1; then
    echo "ℹ️  Hardhat EVM node already active on port 8546."
else
    echo "--> Starting Hardhat Local EVM node on port 8546..."
    (cd "$ROOT_DIR/contracts" && nohup npx hardhat node --port 8546 > "$ROOT_DIR/.hardhat.log" 2>&1 &)
    echo "    Hardhat EVM node launched in background (logs: .hardhat.log)"
    
    # Wait for RPC to respond
    echo "    Waiting for EVM RPC readiness..."
    RPC_READY=false
    for i in {1..30}; do
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
            http://127.0.0.1:8546 >/dev/null 2>&1; then
            RPC_READY=true
            break
        fi
        sleep 0.5
    done
    if [ "$RPC_READY" != "true" ]; then
        echo "❌ Hardhat node failed to become ready on port 8546 within timeout."
        exit 1
    fi
fi

# 2. Deploy Contracts
echo "--> Deploying Solidity smart contracts to local network..."
(cd "$ROOT_DIR/contracts" && npx hardhat run scripts/deploy.js --network localhost)

# 3. FastAPI Backend (port 8001)
if lsof -i :8001 >/dev/null 2>&1; then
    echo "ℹ️  Refreshing FastAPI backend to bind to newly deployed contracts..."
    EXISTING_PID=$(lsof -t -i :8001) || true
    if [ -n "$EXISTING_PID" ]; then
        kill -9 $EXISTING_PID >/dev/null 2>&1 || true
        sleep 1
    fi
fi

echo "--> Starting FastAPI Backend on port 8001..."
if [ -d ".venv" ]; then
    PYTHON_EXEC=".venv/bin/uvicorn"
else
    PYTHON_EXEC="uvicorn"
fi
nohup env PYTHONPATH=backend $PYTHON_EXEC app.main:app --host 0.0.0.0 --port 8001 > "$ROOT_DIR/.backend.log" 2>&1 &
BACKEND_PID=$!
echo "    Backend PID: $BACKEND_PID (logs: .backend.log)"

    echo "    Waiting for Backend health readiness..."
    BACKEND_READY=false
    for i in {1..30}; do
        if curl -s http://127.0.0.1:8001/health >/dev/null 2>&1; then
            BACKEND_READY=true
            break
        fi
        sleep 0.5
    done
    if [ "$BACKEND_READY" != "true" ]; then
        echo "❌ Backend failed to become healthy on port 8001 within timeout."
        exit 1
    fi

# 4. React 19 / Vite Frontend (port 5174)
if lsof -i :5174 >/dev/null 2>&1; then
    echo "ℹ️  Frontend Vite dev server already active on port 5174."
else
    echo "--> Starting Vite Frontend on port 5174..."
    nohup npm --prefix frontend run dev > "$ROOT_DIR/.frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "    Frontend PID: $FRONTEND_PID (logs: .frontend.log)"
fi

echo ""
echo "======================================================================"
echo "✅ PHARMATRACE STACK READY"
echo "   - Frontend UI: http://localhost:5174"
echo "   - Backend API: http://localhost:8001/docs"
echo "   - EVM RPC:     http://localhost:8546"
echo "======================================================================"
