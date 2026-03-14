#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
MAGENTA="\033[35m"
RED="\033[31m"
RESET="\033[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# copy_dir <src_dir> <dest_dir> <label>
#
# Recursively copies all files from src_dir to dest_dir, printing each file.
# ---------------------------------------------------------------------------
copy_dir() {
  local src="$1"
  local dest="$2"
  local label="$3"

  [[ -d "$src" ]] || return 0

  while IFS= read -r -d '' file; do
    local rel="${file#$src/}"
    local target="$dest/$rel"
    mkdir -p "$(dirname "$target")"
    cp "$file" "$target"
    echo "  ${label} ~/${dest##$HOME/}/${rel}"
  done < <(find "$src" -type f -print0)
}

# ---------------------------------------------------------------------------
# install_skills — copies agents/skills/* to ~/.agents/skills
#
# Skills follow the agentskills.io cross-client convention:
#   ~/.agents/skills/  — cross-client interoperability path
# ---------------------------------------------------------------------------
install_skills() {
  local src="$SCRIPT_DIR/agents/skills"
  [[ -d "$src" ]] || return 0

  copy_dir "$src" "$HOME/.agents/skills" "🧠"
}

# ---------------------------------------------------------------------------
# install_agent_bodies — copies agents/custom_agents/* to ~/.agents/custom_agents
# ---------------------------------------------------------------------------
install_agent_bodies() {
  local src="$SCRIPT_DIR/agents/custom_agents"
  [[ -d "$src" ]] || return 0

  copy_dir "$src" "$HOME/.agents/custom_agents" "🤖"
}

# ---------------------------------------------------------------------------
# install_copilot — copies copilot/* to ~/.copilot
# ---------------------------------------------------------------------------
install_copilot() {
  local dest="$HOME/.copilot"
  echo -e "\n${CYAN}${BOLD}🐙 Installing GitHub Copilot customisations...${RESET}"
  echo -e "${YELLOW}   Target : $dest${RESET}"

  copy_dir "$SCRIPT_DIR/copilot" "$dest" "🐙"
  echo -e "\n${GREEN}${BOLD}  ✅ Copilot: $(find "$SCRIPT_DIR/copilot" -type f | wc -l) file(s) installed${RESET}"
}

# ---------------------------------------------------------------------------
# install_claude — copies claude/* to ~/.claude
# ---------------------------------------------------------------------------
install_claude() {
  local dest="$HOME/.claude"
  echo -e "\n${MAGENTA}${BOLD}🤖 Installing Claude Code customisations...${RESET}"
  echo -e "${YELLOW}   Target : $dest${RESET}"

  copy_dir "$SCRIPT_DIR/claude" "$dest" "🤖"
  echo -e "\n${MAGENTA}${BOLD}  ✅ Claude: $(find "$SCRIPT_DIR/claude" -type f | wc -l) file(s) installed${RESET}"
  
  if [ -d ~/.claude/skills ] && [ ! -L ~/.claude/skills ]; then
    read -r -p "   ~/.claude/skills already exists. Back it up before replacing? [Y/n] " backup_choice
    if [[ "$backup_choice" =~ ^[Nn] ]]; then
      rm -rf ~/.claude/skills
      echo -e "${YELLOW}   Removed existing ~/.claude/skills${RESET}"
    else
      mv ~/.claude/skills ~/.claude/skills.bak
      echo -e "${YELLOW}   Backed up existing ~/.claude/skills to ~/.claude/skills.bak${RESET}"
    fi
  fi
  ln -s ~/.agents/skills ~/.claude/skills
  echo -e "${YELLOW}   Symlinked ~/.claude/skills → ~/.agents/skills${RESET}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
echo -e ""
echo -e "${BOLD}${CYAN}  🪙  Token Effort${RESET}"
echo -e "${YELLOW}  Low-stakes intelligence for high-latency humans${RESET}"
echo -e ""
echo -e "  Which platform(s) would you like to set up?"
echo -e ""
echo -e "  ${BOLD}[1]${RESET} 🐙 GitHub Copilot   ${YELLOW}(~/.copilot)${RESET}"
echo -e "  ${BOLD}[2]${RESET} 🤖 Claude Code       ${MAGENTA}(~/.claude)${RESET}"
echo -e "  ${BOLD}[3]${RESET} ✨ Both              ${GREEN}(why not)${RESET}"
echo -e ""

while true; do
  read -r -p "  Enter choice [1-3]: " choice
  case "$choice" in
    1) install_copilot; break ;;
    2) install_claude;  break ;;
    3) install_copilot; install_claude; break ;;
    *) echo -e "  ${RED}That's not a valid option. Try 1, 2, or 3.${RESET}" ;;
  esac
done

# Always install shared cross-platform resources
echo -e "\n${GREEN}${BOLD}  Installing shared resources...${RESET}"
install_agent_bodies
install_skills

echo -e ""
echo -e "${GREEN}${BOLD}  Done. Now go do less.${RESET}"
echo -e ""
