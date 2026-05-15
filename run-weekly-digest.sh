#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCKFILE="/tmp/ios-tvos-weekly-digest.lock"

if [ -f "$LOCKFILE" ]; then
  echo "Digest already running"
  exit 1
fi

trap 'rm -f "$LOCKFILE"' EXIT

touch "$LOCKFILE"

cd "$SCRIPT_DIR"

timeout 20m npm run digest >> digest.log 2>&1