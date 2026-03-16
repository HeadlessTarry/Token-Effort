#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
MAGENTA="\033[35m"
RESET="\033[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# install_claude — copies claude/* to ~/.claude
# ---------------------------------------------------------------------------
install_claude() {
  local src="$SCRIPT_DIR/claude"
  local dest="$HOME/.claude"

  [[ -d "$src" ]] || { echo "Nothing to install."; exit 0; }

  while IFS= read -r -d '' file; do
    local rel="${file#$src/}"
    local target="$dest/$rel"
    mkdir -p "$(dirname "$target")"
    cp "$file" "$target"
    echo -e "  ${MAGENTA}🤖${RESET} ~/.claude/${rel}"
  done < <(find "$src" -type f -print0)
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
echo -e ""
echo -e "${BOLD}${CYAN}  🪙  Token Effort${RESET}"
echo -e "${YELLOW}  Low-stakes intelligence for high-latency humans${RESET}"
echo -e ""
echo -e "${MAGENTA}${BOLD}  Installing Claude Code customisations → ~/.claude${RESET}"
echo -e ""

install_claude

count=$(find "$SCRIPT_DIR/claude" -type f | wc -l)
echo -e ""
echo -e "${GREEN}${BOLD}  ✅ $count file(s) installed. Now go do less.${RESET}"
echo -e ""
