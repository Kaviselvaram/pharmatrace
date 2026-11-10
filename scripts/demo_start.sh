#!/usr/bin/env bash
# ==============================================================================
# PharmaTrace Reliable Single-Command Orchestrated Startup
# CBS3002 Information Security Project - Kaviselvaram & Aniesh S
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$RUN_DIR" "$LOG_DIR"

HARDHAT_PID_FILE="$RUN_DIR/hardhat.pid"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

EVM_PORT=8546
BACKEND_PORT=8001
FRONTEND_PORT=5174

echo "======================================================================"
echo "🚀 STARTING PHARMATRACE FULL-STACK SYSTEM"
echo "======================================================================"
echo "Working directory: $ROOT_DIR"

# 1. Dependency and Tools Validation
echo "--> [1/6] Validating dependencies and environment..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required but not installed."; exit 1; }

PYTHON_EXEC=""
if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
    PYTHON_EXEC="$ROOT_DIR/.venv/bin/python"
    UVICORN_EXEC="$ROOT_DIR/.venv/bin/uvicorn"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_EXEC="$(command -v python3)"
    UVICORN_EXEC="$(command -v uvicorn 2>/dev/null || echo '')"
else
    echo "❌ Python virtual environment or python3 executable not found."
    exit 1
fi
echo "    ✔ Node.js: $(node --version)"
echo "    ✔ Python:  $($PYTHON_EXEC --version) ($PYTHON_EXEC)"

# Helper: check if a PID is alive
is_pid_running() {
    local pid="$1"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

# 2. Local EVM Node (Port 8546)
echo "--> [2/6] Starting / Verifying Local EVM Node (Port $EVM_PORT)..."
EVM_ALIVE=false
if [ -f "$HARDHAT_PID_FILE" ]; then
    SAVED_PID=$(cat "$HARDHAT_PID_FILE")
    if is_pid_running "$SAVED_PID"; then
        EVM_ALIVE=true
    fi
fi

if ! $EVM_ALIVE; then
    if lsof -i :$EVM_PORT >/dev/null 2>&1; then
        OCC_PID=$(lsof -t -i :$EVM_PORT | head -n 1)
        echo "    ℹ️ Port $EVM_PORT in use by PID $OCC_PID. Adopting as EVM."
        echo "$OCC_PID" > "$HARDHAT_PID_FILE"
    else
        echo "    Launching Hardhat EVM Node..."
        (cd "$ROOT_DIR/contracts" && nohup npx hardhat node --port $EVM_PORT > "$LOG_DIR/hardhat.log" 2>&1 & echo $! > "$HARDHAT_PID_FILE")
        echo "    EVM launched (PID: $(cat "$HARDHAT_PID_FILE"), logs: .logs/hardhat.log)"
    fi
fi

# Bounded Polling for EVM RPC
echo "    Waiting for EVM RPC (http://127.0.0.1:$EVM_PORT)..."
RPC_READY=false
for i in {1..40}; do
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://127.0.0.1:$EVM_PORT 2>&1 | grep -q "result"; then
        RPC_READY=true
        break
    fi
    sleep 0.5
done

if ! $RPC_READY; then
    echo "❌ Hardhat node failed to become ready on port $EVM_PORT within 20s."
    exit 1
fi
echo "    ✔ EVM RPC is responsive on port $EVM_PORT."

# 3. Contract Deployment Verification
echo "--> [3/6] Verifying Solidity Smart Contract Deployments..."
DEPLOYMENTS_FILE="$ROOT_DIR/contracts/deployments/local.json"
NEED_DEPLOY=true

if [ -f "$DEPLOYMENTS_FILE" ]; then
    SUPPLY_CHAIN_ADDR=$($PYTHON_EXEC -c "import json; print(json.load(open('$DEPLOYMENTS_FILE'))['contracts']['PharmaSupplyChain']['address'])" 2>/dev/null || echo "")
    if [ -n "$SUPPLY_CHAIN_ADDR" ]; then
        CODE=$(curl -s -X POST -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$SUPPLY_CHAIN_ADDR\",\"latest\"],\"id\":1}" \
            http://127.0.0.1:$EVM_PORT | $PYTHON_EXEC -c "import sys, json; res=json.load(sys.stdin); print(res.get('result','0x'))" 2>/dev/null || echo "0x")
        if [ "$CODE" != "0x" ] && [ -n "$CODE" ]; then
            NEED_DEPLOY=false
            echo "    ✔ Existing on-chain contracts verified at $SUPPLY_CHAIN_ADDR."
        fi
    fi
fi

if $NEED_DEPLOY; then
    echo "    Deploying smart contracts to local EVM..."
    (cd "$ROOT_DIR/contracts" && npx hardhat run scripts/deploy.js --network localhost)
    echo "    ✔ Smart contracts deployed successfully."
fi

# 4. Safe Database Initialization
echo "--> [4/6] Verifying SQLite Database & Tables..."
mkdir -p "$ROOT_DIR/data"
$PYTHON_EXEC -c "
import sys, asyncio
sys.path.insert(0, '$ROOT_DIR/backend')
from app.core.database import init_db
asyncio.run(init_db())
print('    ✔ SQLite database initialized at data/infosecproj.db.')
"

# 5. FastAPI Backend (Port 8001)
echo "--> [5/6] Starting / Verifying FastAPI Backend (Port $BACKEND_PORT)..."
BACKEND_ALIVE=false
if [ -f "$BACKEND_PID_FILE" ]; then
    SAVED_PID=$(cat "$BACKEND_PID_FILE")
    if is_pid_running "$SAVED_PID"; then
        BACKEND_ALIVE=true
    fi
fi

if ! $BACKEND_ALIVE; then
    if lsof -i :$BACKEND_PORT >/dev/null 2>&1; then
        OCC_PID=$(lsof -t -i :$BACKEND_PORT | head -n 1)
        echo "    ℹ️ Port $BACKEND_PORT is occupied by PID $OCC_PID. Restarting for clean contract binding..."
        kill -15 "$OCC_PID" 2>/dev/null || kill -9 "$OCC_PID" 2>/dev/null || true
        sleep 1
    fi

    echo "    Launching FastAPI backend via uvicorn..."
    nohup env PYTHONPATH="$ROOT_DIR/backend" "$UVICORN_EXEC" app.main:app --host 0.0.0.0 --port $BACKEND_PORT > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    echo "    Backend launched (PID: $(cat "$BACKEND_PID_FILE"), logs: .logs/backend.log)"
fi

# Bounded Polling for Backend Health
echo "    Waiting for Backend health endpoint (http://127.0.0.1:$BACKEND_PORT/health)..."
BACKEND_READY=false
for i in {1..40}; do
    if curl -s "http://127.0.0.1:$BACKEND_PORT/health" 2>&1 | grep -q "HEALTHY"; then
        BACKEND_READY=true
        break
    fi
    sleep 0.5
done

if ! $BACKEND_READY; then
    echo "❌ Backend failed to become healthy on port $BACKEND_PORT within 20s."
    echo "--- Last 20 lines of backend.log ---"
    tail -n 20 "$LOG_DIR/backend.log" || true
    exit 1
fi
echo "    ✔ Backend is healthy on port $BACKEND_PORT."

# Verify Backend-to-Blockchain and Database Connectivity
CHAIN_STATUS=$(curl -s "http://127.0.0.1:$BACKEND_PORT/api/v1/blockchain/status" || echo "{}")
IS_CONNECTED=$($PYTHON_EXEC -c "import json; print(json.loads('''$CHAIN_STATUS''').get('connected', False))" 2>/dev/null || echo "False")
if [ "$IS_CONNECTED" != "True" ]; then
    echo "❌ Backend reported EVM is disconnected: $CHAIN_STATUS"
    exit 1
fi
echo "    ✔ Backend on-chain EVM connectivity verified (connected=True)."

# 6. React / Vite Frontend (Port 5174)
echo "--> [6/6] Starting / Verifying Vite Frontend (Port $FRONTEND_PORT)..."
FRONTEND_ALIVE=false
if [ -f "$FRONTEND_PID_FILE" ]; then
    SAVED_PID=$(cat "$FRONTEND_PID_FILE")
    if is_pid_running "$SAVED_PID"; then
        FRONTEND_ALIVE=true
    fi
fi

if ! $FRONTEND_ALIVE; then
    if lsof -i :$FRONTEND_PORT >/dev/null 2>&1; then
        OCC_PID=$(lsof -t -i :$FRONTEND_PORT | head -n 1)
        echo "    ℹ️ Port $FRONTEND_PORT occupied by PID $OCC_PID. Adopting as Frontend."
        echo "$OCC_PID" > "$FRONTEND_PID_FILE"
    else
        echo "    Launching Vite frontend dev server..."
        (cd "$ROOT_DIR/frontend" && nohup npm run dev -- --port $FRONTEND_PORT > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$FRONTEND_PID_FILE")
        echo "    Frontend launched (PID: $(cat "$FRONTEND_PID_FILE"), logs: .logs/frontend.log)"
    fi
fi

# Bounded Polling for Frontend HTTP
echo "    Waiting for Frontend HTTP endpoint (http://localhost:$FRONTEND_PORT)..."
FRONTEND_READY=false
for i in {1..30}; do
    if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        FRONTEND_READY=true
        break
    fi
    sleep 0.5
done

if ! $FRONTEND_READY; then
    echo "❌ Frontend failed to respond on port $FRONTEND_PORT within 15s."
    exit 1
fi
echo "    ✔ Frontend is responsive on http://localhost:$FRONTEND_PORT."

# Verify Vite Proxy Connectivity
PROXY_STATUS=$(curl -s "http://localhost:$FRONTEND_PORT/api/v1/blockchain/status" 2>/dev/null || echo "{}")
PROXY_OK=$($PYTHON_EXEC -c "import json; print(json.loads('''$PROXY_STATUS''').get('connected', False))" 2>/dev/null || echo "False")
if [ "$PROXY_OK" != "True" ]; then
    echo "⚠️ Notice: Frontend proxy check to /api/v1/blockchain/status returned: $PROXY_STATUS"
else
    echo "    ✔ Frontend proxy -> Backend routing confirmed."
fi

echo ""
echo "======================================================================"
echo "🎉 ALL PHARMATRACE SERVICES SUCCESSFULLY RUNNING & VERIFIED"
echo "======================================================================"
echo "   • Frontend UI:       http://localhost:$FRONTEND_PORT"
echo "   • Backend API Docs:  http://localhost:$BACKEND_PORT/docs"
echo "   • Backend Health:    http://localhost:$BACKEND_PORT/health"
echo "   • Hardhat EVM RPC:   http://localhost:$EVM_PORT"
echo "   • Service PIDs:      EVM=$(cat "$HARDHAT_PID_FILE" 2>/dev/null || echo '?'), Backend=$(cat "$BACKEND_PID_FILE" 2>/dev/null || echo '?'), Frontend=$(cat "$FRONTEND_PID_FILE" 2>/dev/null || echo '?')"
echo "======================================================================"
echo "To seed demo dataset: npm run demo:seed"
echo "To stop services:     npm run demo:stop"
echo "======================================================================"
