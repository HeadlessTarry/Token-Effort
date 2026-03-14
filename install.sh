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
# assemble_agent <src> <platform> <dest_agents_dir>
#
# Reads a dual-platform agent source file, extracts the section for <platform>,
# applies body substitutions, and writes the assembled file to <dest_agents_dir>.
#
# Source file format:
#   #[platform:copilot]        <- section marker
#   # KEY: value               <- metadata / substitution variables (stripped from output)
#   ---                        <- start of clean frontmatter
#   name: "..."
#   ---                        <- end of frontmatter
#
#   #[platform:claude]
#   # KEY: value
#   ---
#   name: "..."
#   ---
#
#   #[body]                    <- shared body; {{KEY}} replaced by matching metadata values
#   ...
# ---------------------------------------------------------------------------
assemble_agent() {
  local src="$1"
  local platform="$2"
  local dest_dir="$3"

  local filename
  filename=$(basename "$src")

  # Derive output filename: copilot gets .agent.md, claude keeps .md
  local output
  if [[ "$platform" == "copilot" ]]; then
    output="${filename%.md}.agent.md"
  else
    output="$filename"
  fi

  # Extract the platform section: lines between #[platform:X] and the next #[ marker
  local section
  section=$(awk \
    -v plat="$platform" \
    '/^#\[platform:/ { if ($0 == "#[platform:" plat "]") { found=1; next } else { found=0 } }
     /^#\[body\]/ { found=0 }
     found { print }' \
    "$src")

  if [[ -z "$section" ]]; then
    echo -e "${RED}  ✗ No [platform:${platform}] section found in $(basename "$src")${RESET}" >&2
    return 1
  fi

  # Build a sed expression dynamically from all "# KEY: value" metadata lines.
  # Any {{KEY}} in the body is replaced with the corresponding value.
  # Adding a new {{VAR}} only requires a "# VAR: value" line in the source file — no script changes needed.
  # Uses | as the sed delimiter so values containing / are safe.
  local sed_expr=""
  while IFS= read -r meta_line; do
    local key value
    key=$(printf '%s' "$meta_line"  | sed 's/^# \([A-Z_][A-Z_]*\):.*/\1/')
    value=$(printf '%s' "$meta_line" | sed 's/^# [A-Z_][A-Z_]*: //')
    # Escape & (means "matched text" in sed replacement); / is safe with | delimiter
    value=$(printf '%s' "$value" | sed 's/&/\\&/g')
    sed_expr="${sed_expr}s|{{${key}}}|${value}|g;"
  done < <(printf '%s\n' "$section" | grep '^# [A-Z_][A-Z_]*:')

  # Extract clean frontmatter: lines between --- delimiters, excluding # metadata lines
  local frontmatter
  frontmatter=$(printf '%s\n' "$section" | awk \
    '/^---/ { if (in_fm) { exit } else { in_fm=1; next } }
     in_fm && !/^# / { print }')

  # Extract shared body: everything after #[body]
  local body
  body=$(awk '/^#\[body\]/ { found=1; next } found { print }' "$src")

  # Apply substitutions
  if [[ -n "$sed_expr" ]]; then
    body=$(printf '%s\n' "$body" | sed "$sed_expr")
  fi

  # Write assembled file
  mkdir -p "$dest_dir"
  {
    printf -- '---\n'
    printf '%s\n' "$frontmatter"
    printf -- '---\n'
    printf '%s\n' "$body"
  } > "$dest_dir/$output"

  printf '  🤖 %s/%s\n' "$(basename "$dest_dir")" "$output"
}

# ---------------------------------------------------------------------------
# install_copilot — assembles agents + copies github-copilot/** to ~/.copilot
# ---------------------------------------------------------------------------
install_copilot() {
  local dest="$HOME/.copilot"
  echo -e "\n${CYAN}${BOLD}🐙 Installing GitHub Copilot customisations...${RESET}"
  echo -e "${YELLOW}   Target : $dest${RESET}"

  mkdir -p "$dest/agents"

  local count=0

  # Assemble dual-platform agents
  for src in "$SCRIPT_DIR/agents/"*.md; do
    [[ -f "$src" ]] || continue
    assemble_agent "$src" "copilot" "$dest/agents"
    (( ++count ))
  done

  # Copy Copilot-specific content (skills, prompts, instructions, etc.)
  local copilot_src="$SCRIPT_DIR/github-copilot"
  if [[ -d "$copilot_src" ]]; then
    while IFS= read -r -d '' file; do
      local rel="${file#$copilot_src/}"
      local target="$dest/$rel"
      mkdir -p "$(dirname "$target")"
      cp "$file" "$target"
      echo "  🐙 ~/.copilot/${rel}"
      (( ++count ))
    done < <(find "$copilot_src" -type f -print0)
  fi

  echo -e "\n${GREEN}${BOLD}  ✅ Copilot: $count file(s) installed to $dest${RESET}"
}

# ---------------------------------------------------------------------------
# install_claude — assembles agents + copies claude/** to ~/.claude
# ---------------------------------------------------------------------------
install_claude() {
  local dest="$HOME/.claude"
  echo -e "\n${MAGENTA}${BOLD}🤖 Installing Claude Code customisations...${RESET}"
  echo -e "${YELLOW}   Target : $dest${RESET}"

  mkdir -p "$dest/agents"

  local count=0

  # Assemble dual-platform agents
  for src in "$SCRIPT_DIR/agents/"*.md; do
    [[ -f "$src" ]] || continue
    assemble_agent "$src" "claude" "$dest/agents"
    (( ++count ))
  done

  # Copy Claude-specific content (skills, etc.)
  local claude_src="$SCRIPT_DIR/claude"
  if [[ -d "$claude_src" ]]; then
    while IFS= read -r -d '' file; do
      local rel="${file#$claude_src/}"
      local target="$dest/$rel"
      mkdir -p "$(dirname "$target")"
      cp "$file" "$target"
      echo "  🤖 ~/.claude/${rel}"
      (( ++count ))
    done < <(find "$claude_src" -type f -print0)
  fi

  echo -e "\n${MAGENTA}${BOLD}  ✅ Claude: $count file(s) installed to $dest${RESET}"
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

echo -e ""
echo -e "${GREEN}${BOLD}  Done. Now go do less.${RESET}"
echo -e ""
