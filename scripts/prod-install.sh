#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

ensure_dirs
cd "$ROOT_DIR"

if ! command_exists python3 || ! command_exists npm; then
  echo "python3 or npm is missing. Run ./scripts/bootstrap-server.sh first."
  exit 1
fi

require_command python3
require_command npm

if ! venv_ready; then
  echo "Creating Python virtual environment at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

echo "Installing backend dependencies"
"$(pip_bin)" install --upgrade pip
"$(pip_bin)" install -r backend/requirements.txt

echo "Installing frontend dependencies"
npm ci

echo "Building frontend"
npm run build

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Warning: .env is missing. Create it from .env.example before using image generation."
fi

echo "Install and build completed."
