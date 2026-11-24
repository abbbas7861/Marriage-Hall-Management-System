#!/usr/bin/env bash
# ==============================================================================
# Mehar Palace Marquee - Enterprise Application Launcher
# Automatically frees ports (8000, 3000), starts Django Backend & Vite Frontend,
# maintains proxy connection, and opens the system in your default browser.
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
PYTHON_BIN="${BACKEND_DIR}/venv/bin/python"

if [ ! -f "${PYTHON_BIN}" ]; then
  PYTHON_BIN="python3"
fi

BACKEND_PORT=8000
FRONTEND_PORT=3000
APP_URL="http://localhost:${FRONTEND_PORT}"

echo "=========================================================="
echo "🏰 Launching Mehar Palace Marquee Management System..."
echo "=========================================================="

# Function to safely kill any process holding a specific port
kill_port_process() {
  local port=$1
  echo "[1/4] Checking and clearing port :${port}..."
  
  # Method 1: fuser
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi

  # Method 2: lsof
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti :"${port}" 2>/dev/null || true)
    if [ -n "${pids}" ]; then
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi

  # Method 3: ss / netstat + kill
  if command -v ss >/dev/null 2>&1; then
    local ss_pids
    ss_pids=$(ss -lptn "sport = :${port}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 || true)
    if [ -n "${ss_pids}" ]; then
      kill -9 ${ss_pids} 2>/dev/null || true
    fi
  fi
}

# Kill existing processes on backend and frontend ports to avoid busy port errors
kill_port_process ${BACKEND_PORT}
kill_port_process ${FRONTEND_PORT}
sleep 1

# Ensure migrations are up to date
echo "[2/4] Verifying database schema & migrations..."
"${PYTHON_BIN}" "${BACKEND_DIR}/manage.py" migrate --noinput >/dev/null 2>&1 || true

# Start Django Backend Server
echo "[3/4] Starting Django Backend on http://127.0.0.1:${BACKEND_PORT}..."
"${PYTHON_BIN}" "${BACKEND_DIR}/manage.py" runserver "127.0.0.1:${BACKEND_PORT}" > "${PROJECT_DIR}/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be responsive
echo "Waiting for Backend to initialize..."
for i in {1..30}; do
  if curl -s "http://127.0.0.1:${BACKEND_PORT}/api/v1/halls/" >/dev/null 2>&1 || curl -s "http://127.0.0.1:${BACKEND_PORT}/" >/dev/null 2>&1; then
    echo "✓ Backend API is live and connected!"
    break
  fi
  sleep 0.5
done

# Start Frontend Vite Server
echo "[4/4] Starting Frontend on http://localhost:${FRONTEND_PORT}..."
(cd "${FRONTEND_DIR}" && npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT}) > "${PROJECT_DIR}/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be responsive
echo "Waiting for Frontend to initialize..."
for i in {1..30}; do
  if curl -s "${APP_URL}" >/dev/null 2>&1; then
    echo "✓ Frontend interface is live!"
    break
  fi
  sleep 0.5
done

# Automatically open default browser
echo "Launching browser at ${APP_URL}..."
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${APP_URL}" >/dev/null 2>&1 || true
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome "${APP_URL}" >/dev/null 2>&1 || true
elif command -v firefox >/dev/null 2>&1; then
  firefox "${APP_URL}" >/dev/null 2>&1 || true
fi

echo ""
echo "=========================================================="
echo "🎉 Mehar Palace is running!"
echo "• URL: ${APP_URL}"
echo "• Backend: http://127.0.0.1:${BACKEND_PORT}"
echo "• Press Ctrl+C in this terminal to shut down both servers."
echo "=========================================================="

# Cleanup function on Ctrl+C or script termination
cleanup() {
  echo ""
  echo "Shutting down Mehar Palace servers..."
  kill -TERM ${BACKEND_PID} 2>/dev/null || true
  kill -TERM ${FRONTEND_PID} 2>/dev/null || true
  kill_port_process ${BACKEND_PORT}
  kill_port_process ${FRONTEND_PORT}
  echo "✓ Servers stopped cleanly."
  exit 0
}

trap cleanup INT TERM EXIT

# Keep script running in foreground so user can monitor and stop anytime
wait
