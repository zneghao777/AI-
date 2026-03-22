#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$ROOT_DIR/scripts"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/logs}"
RUN_DIR="${RUN_DIR:-$ROOT_DIR/run}"
VENV_DIR="${VENV_DIR:-$ROOT_DIR/.venv}"
PID_FILE="${PID_FILE:-$RUN_DIR/backend.pid}"
BACKEND_LOG_FILE="${BACKEND_LOG_FILE:-$LOG_DIR/backend.log}"
APP_MODULE="${APP_MODULE:-backend.app:app}"
APP_HOST="${APP_HOST:-0.0.0.0}"
APP_PORT="${APP_PORT:-8000}"
HEALTHCHECK_HOST="${HEALTHCHECK_HOST:-127.0.0.1}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://${HEALTHCHECK_HOST}:${APP_PORT}/api/health}"

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$RUN_DIR"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  if ! command_exists "$1"; then
    echo "Missing required command: $1" >&2
    return 1
  fi
}

python_bin() {
  echo "$VENV_DIR/bin/python"
}

pip_bin() {
  echo "$VENV_DIR/bin/pip"
}

venv_ready() {
  [[ -x "$(python_bin)" && -x "$(pip_bin)" ]]
}

node_modules_ready() {
  [[ -d "$ROOT_DIR/node_modules" ]]
}

frontend_build_ready() {
  [[ -f "$ROOT_DIR/dist/index.html" ]]
}

frontend_build_stale() {
  if ! frontend_build_ready; then
    return 0
  fi

  if [[ "$ROOT_DIR/package.json" -nt "$ROOT_DIR/dist/index.html" ]]; then
    return 0
  fi

  if [[ -d "$ROOT_DIR/src" ]] && find "$ROOT_DIR/src" -type f -newer "$ROOT_DIR/dist/index.html" | grep -q .; then
    return 0
  fi

  if [[ -d "$ROOT_DIR/public" ]] && find "$ROOT_DIR/public" -type f -newer "$ROOT_DIR/dist/index.html" | grep -q .; then
    return 0
  fi

  return 1
}

read_pid() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
  fi
}

is_running() {
  local pid
  pid="$(read_pid)"
  if [[ -z "${pid:-}" ]]; then
    return 1
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    return 0
  fi

  rm -f "$PID_FILE"
  return 1
}

healthcheck() {
  if command_exists curl; then
    curl --silent --fail --max-time 2 "$HEALTHCHECK_URL" >/dev/null
    return $?
  fi

  if ! venv_ready; then
    return 1
  fi

  "$(python_bin)" - "$HEALTHCHECK_URL" <<'PY' >/dev/null 2>&1
import sys
from urllib.request import urlopen

url = sys.argv[1]
with urlopen(url, timeout=2):
    pass
PY
}

port_is_busy() {
  if command_exists lsof; then
    lsof -iTCP:"$APP_PORT" -sTCP:LISTEN -t >/dev/null 2>&1
    return $?
  fi

  python3 - "$HEALTHCHECK_HOST" "$APP_PORT" <<'PY' >/dev/null 2>&1
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.settimeout(1)
    sys.exit(0 if sock.connect_ex((host, port)) == 0 else 1)
PY
}
