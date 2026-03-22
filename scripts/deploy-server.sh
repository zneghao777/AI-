#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

"$SCRIPT_DIR/bootstrap-server.sh"
"$SCRIPT_DIR/prod-install.sh"
"$SCRIPT_DIR/prod-start.sh"
