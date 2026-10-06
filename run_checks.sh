#!/bin/bash
set -e
set -o pipefail

echo "✅ Running pre-commit checks..."
# no-commit-to-branch guards commits, not code; skip it so checks also pass on main.
SKIP=no-commit-to-branch uvx pre-commit run --all-files

echo ""
echo "✅ All checks passed!"
