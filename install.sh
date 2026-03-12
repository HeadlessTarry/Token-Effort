#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RESET="\033[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/github-copilot"
DEST="$HOME/.copilot"

echo -e "${CYAN}${BOLD}🚀 Installing Copilot customisations...${RESET}"
echo -e "${YELLOW}   Source : $SRC${RESET}"
echo -e "${YELLOW}   Target : $DEST${RESET}"

mkdir -p "$DEST"

count=0
while IFS= read -r -d '' file; do
  rel="${file#$SRC/}"
  target="$DEST/$rel"
  mkdir -p "$(dirname "$target")"
  cp "$file" "$target"
  echo -e "  📄 ~/.copilot/${rel}"
  (( ++count ))
done < <(find "$SRC" -type f -print0)

echo ""
echo -e "${GREEN}${BOLD}✅ Done!${RESET} $count file(s) copied to $DEST"
