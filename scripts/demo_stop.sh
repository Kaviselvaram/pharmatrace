#!/usr/bin/env bash
# ==============================================================================
# PharmaTrace Graceful Shutdown Script
# CBS3002 Information Security Project - Kaviselvaram & Aniesh S
# ==============================================================================

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUN_DIR="$ROOT_DIR/.run"

echo "======================================================================"
echo "🛑 STOPPING PHARMATRACE SERVICES"
echo "======================================================================"

stop_pid_service() {
    local name="$1"
    local pid_file="$2"

    if [ ! -f "$pid_file" ]; then
        echo "ℹ️  No recorded PID file for $name ($pid_file)."
        return 0
    fi

    local pid=$(cat "$pid_file" 2>/dev/null || echo "")
    if [ -z "$pid" ]; then
        rm -f "$pid_file"
        return 0
    fi

    if kill -0 "$pid" 2>/dev/null; then
        echo "--> Stopping $name (PID $pid)..."
        kill -15 "$pid" 2>/dev/null || true
        
        # Wait up to 5s for graceful exit
        local exited=false
        for i in {1..10}; do
            if ! kill -0 "$pid" 2>/dev/null; then
                exited=true
                break
            fi
            sleep 0.5
        done

        if ! $exited; then
            echo "    Force stopping $name (PID $pid)..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        echo "    ✔ $name stopped."
    else
        echo "ℹ️  $name process (PID $pid) was not running."
    fi

    rm -f "$pid_file"
}

stop_pid_service "Vite Frontend" "$RUN_DIR/frontend.pid"
stop_pid_service "FastAPI Backend" "$RUN_DIR/backend.pid"
stop_pid_service "Hardhat EVM Node" "$RUN_DIR/hardhat.pid"

echo ""
echo "✅ All PharmaTrace project-owned services stopped cleanly."
echo "======================================================================"
