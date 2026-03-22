#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

ensure_dirs

if is_running; then
  echo "Status: running"
  echo "PID: $(read_pid)"
  echo "URL: http://127.0.0.1:${APP_PORT}"
  echo "Log: $BACKEND_LOG_FILE"

  if healthcheck; then
    echo "Health: ok"
  else
    echo "Health: failed"
  fi
elif port_is_busy; then
  echo "Status: unmanaged process is using port ${APP_PORT}"
  echo "URL: http://127.0.0.1:${APP_PORT}"
  echo "Log: $BACKEND_LOG_FILE"

  if healthcheck; then
    echo "Health: ok"
  else
    echo "Health: failed"
  fi
else
  echo "Status: stopped"
  echo "Log: $BACKEND_LOG_FILE"
fi
