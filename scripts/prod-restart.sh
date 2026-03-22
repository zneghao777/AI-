#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

"$SCRIPT_DIR/prod-stop.sh"
"$SCRIPT_DIR/prod-start.sh"
