#!/bin/bash
set -e
set -o pipefail

option="${1:-}"

echo "🪝 Setting up git hooks..."
uvx --no-build pre-commit install

echo ""
echo "🔍 Let's just check everything is working..."
if [[ "$option" != "--skip-checks" ]]; then
    ./run_checks.sh
fi
