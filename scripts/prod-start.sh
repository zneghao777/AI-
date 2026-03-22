#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

ensure_dirs
cd "$ROOT_DIR"

if is_running; then
  echo "App is already running with PID $(read_pid)"
  exit 0
fi

if ! venv_ready || ! node_modules_ready; then
  echo "Dependencies are missing. Running prod-install.sh first."
  "$SCRIPT_DIR/prod-install.sh"
elif frontend_build_stale; then
  echo "Frontend build is missing or outdated. Rebuilding frontend."
  npm run build
fi

if port_is_busy; then
  echo "Port ${APP_PORT} is already in use. Stop the existing process or set APP_PORT to another port."
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Warning: .env is missing. The service will start, but AI image generation will not work."
fi

echo "Starting app on ${APP_HOST}:${APP_PORT}"
nohup "$(python_bin)" -m uvicorn "$APP_MODULE" \
  --host "$APP_HOST" \
  --port "$APP_PORT" \
  --log-level "${UVICORN_LOG_LEVEL:-info}" \
  >"$BACKEND_LOG_FILE" 2>&1 &

echo $! > "$PID_FILE"

for _ in $(seq 1 20); do
  if healthcheck; then
    echo "App started successfully. Visit http://127.0.0.1:${APP_PORT} on the server."
    exit 0
  fi

  if ! is_running; then
    echo "App failed to start. Recent logs:"
    tail -n 50 "$BACKEND_LOG_FILE" || true
    exit 1
  fi

  sleep 1
done

echo "App process is running, but the health check did not pass in time."
echo "Check logs with: tail -f $BACKEND_LOG_FILE"
exit 1
