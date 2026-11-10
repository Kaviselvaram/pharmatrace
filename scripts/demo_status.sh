#!/usr/bin/env bash
# ==============================================================================
# PharmaTrace Stack Status Diagnostics
# CBS3002 Information Security Project - Kaviselvaram & Aniesh S
# ==============================================================================

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUN_DIR="$ROOT_DIR/.run"

echo "======================================================================"
echo "📊 PHARMATRACE SERVICE HEALTH & STATUS REPORT"
echo "======================================================================"

check_service() {
    local name="$1"
    local port="$2"
    local pid_file="$3"
    local health_cmd="$4"

    local pid=$(cat "$pid_file" 2>/dev/null || echo "N/A")
    local port_pids=$(lsof -t -i :"$port" 2>/dev/null | tr '\n' ' ' || echo "")
    
    printf "%-22s | Port: %-5s | Saved PID: %-7s | Port PIDs: %-12s | " "$name" "$port" "$pid" "${port_pids:-none}"
    
    if eval "$health_cmd" >/dev/null 2>&1; then
        echo "🟢 HEALTHY"
    else
        echo "🔴 UNHEALTHY / DOWN"
    fi
}

check_service "Hardhat EVM (RPC)" 8546 "$RUN_DIR/hardhat.pid" \
    "curl -s -X POST -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' http://127.0.0.1:8546 | grep -q result"

check_service "FastAPI Backend" 8001 "$RUN_DIR/backend.pid" \
    "curl -s http://127.0.0.1:8001/health | grep -q HEALTHY"

check_service "Vite Frontend" 5174 "$RUN_DIR/frontend.pid" \
    "curl -s http://localhost:5174 >/dev/null"

echo "----------------------------------------------------------------------"
echo "On-Chain Blockchain Gateway:"
curl -s http://127.0.0.1:8001/api/v1/blockchain/status 2>/dev/null || echo "Backend unreachable"
echo ""
echo "SQLite Database Record Count:"
if [ -f "data/infosecproj.db" ]; then
    sqlite3 data/infosecproj.db "SELECT 'Batches: ' || count(*) FROM batches; SELECT 'Telemetry: ' || count(*) FROM telemetry_records; SELECT 'Alerts: ' || count(*) FROM security_alerts;" 2>/dev/null || echo "DB query failed"
else
    echo "data/infosecproj.db not found"
fi
echo "======================================================================"
