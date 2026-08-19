#!/usr/bin/env bash
# Starts the SAFE HIRE backend (Flask, port 5050) and frontend (CRA, port 3000)
# together. Run this from the project root:
#
#   ./start.sh
#
# Stop both with Ctrl+C.

set -e
cd "$(dirname "$0")"

echo "== SAFE HIRE: starting backend =="
cd backend

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
  echo "No backend/.env found — copying .env.example. Edit it (JWT_SECRET_KEY, ADMIN_EMAILS) before real use."
  cp .env.example .env
fi

python3 app.py &
BACKEND_PID=$!
deactivate
cd ..

# Give Flask a moment to bind the port before the frontend starts hitting it
sleep 2

echo "== SAFE HIRE: starting frontend =="
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo ""
echo "Backend:  http://localhost:5050"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."
wait
