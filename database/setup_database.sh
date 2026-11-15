#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
npm --prefix "$SCRIPT_DIR/../server" run db:setup
