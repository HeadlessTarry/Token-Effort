#!/usr/bin/env bash
set -euo pipefail

option="${1:-}"

echo "📦 Installing pinned npm tools..."
npm ci

echo ""
echo "🪝 Setting up git hooks..."
uvx --no-build pre-commit install

echo ""
echo "🔍 Let's just check everything is working..."
if [[ "$option" != "--skip-checks" ]]; then
    ./run_checks.sh
fi
