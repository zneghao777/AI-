#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

ensure_dirs

if ! is_running; then
  echo "App is not running."
  exit 0
fi

pid="$(read_pid)"
echo "Stopping app with PID $pid"
kill "$pid"

for _ in $(seq 1 10); do
  if ! kill -0 "$pid" >/dev/null 2>&1; then
    rm -f "$PID_FILE"
    echo "App stopped."
    exit 0
  fi
  sleep 1
done

echo "App did not stop gracefully. Killing it now."
kill -9 "$pid" >/dev/null 2>&1 || true
rm -f "$PID_FILE"
echo "App stopped."
