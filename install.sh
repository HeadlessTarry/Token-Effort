#!/usr/bin/env bash
# Token-Effort installer: configures Claude Code in ~/.claude (or $CLAUDE_CONFIG_DIR).
# Safe to re-run; running it again is how updates happen.
#
# Usage: ./install.sh [--persona <name>] [--skills <id,...|all>] [--reconfigure]
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_SRC="$REPO_DIR/config"
# platform_config_dir <platform>: the platform's config root (its env var, else its default dir)
platform_config_dir() {
  local platform="$1"
  case "$platform" in
    claude) printf '%s' "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" ;;
    *) printf 'unknown platform: %s\n' "$platform" >&2; return 1 ;;
  esac
}
CLAUDE_DIR="$(platform_config_dir claude)"
STATE_FILE="$CLAUDE_DIR/.token-effort-state"
PERSONA_MARKETPLACE="token-effort"
# Third-party skill sets offered at install, one per line: <id> <plugin>@<marketplace> <github-repo>
SKILLSETS_AVAILABLE="mattpocock mattpocock-skills@mattpocock mattpocock/skills
pstack pstack@pstack-claude michael-denyer/pstack-claude"

PERSONA="" SKILLSETS="" RECONFIGURE=0
SUMMARY=()
LAST_PLUGIN_VERSION=""
NEXT_STEPS=()
CHOSEN_SKILLSETS=()

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_BOLD=$'\e[1m' C_DIM=$'\e[2m' C_GREEN=$'\e[32m' C_YELLOW=$'\e[33m' C_RED=$'\e[31m' C_RESET=$'\e[0m'
else
  C_BOLD="" C_DIM="" C_GREEN="" C_YELLOW="" C_RED="" C_RESET=""
fi

log()     { printf '%s\n' "$*"; }
heading() { printf '\n%s%s%s\n' "$C_BOLD" "$*" "$C_RESET"; }
step()    { printf '  %s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }
ok()      { printf '  %s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn()    { printf '  %s⚠ %s%s\n' "$C_YELLOW" "$*" "$C_RESET" >&2; }
die()     { printf '%s💥 %s%s\n' "$C_RED" "$*" "$C_RESET" >&2; exit 1; }
note()    { SUMMARY+=("$*"); }

usage() {
  sed -n '2,5p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    local flag="$1" value="${2:-}"
    case "$flag" in
      --persona)     PERSONA="${value:?--persona needs a value}"; shift 2 ;;
      --skills)      SKILLSETS="${value:?--skills needs a value}"; shift 2 ;;
      --reconfigure) RECONFIGURE=1; shift ;;
      -h|--help)     usage; exit 0 ;;
      *) usage >&2; die "unknown argument: $flag" ;;
    esac
  done
}

# lower <text>: lower-case the text
lower() { local text="$1"; printf '%s' "$text" | tr '[:upper:]' '[:lower:]'; }

# skillset_entries: the skill set table, one "<id> <plugin> <repo>" line each
skillset_entries() { printf '%s\n' "$SKILLSETS_AVAILABLE"; }

# ---------- state (key=value file) ----------

state_get() { # key
  local key="$1"
  [[ -f "$STATE_FILE" ]] || return 0
  sed -n "s/^$key=//p" "$STATE_FILE" | tail -n 1
}

state_set() { # key value
  local key="$1" value="$2" tmp="$STATE_FILE.tmp"
  { [[ -f "$STATE_FILE" ]] && grep -v "^$key=" "$STATE_FILE" || true; printf '%s=%s\n' "$key" "$value"; } > "$tmp"
  mv "$tmp" "$STATE_FILE"
}

# ---------- prompts ----------

can_prompt() { [[ -t 0 ]]; }

# choose <prompt> <default> <option>... -> prints the chosen option
choose() {
  local prompt="$1" default="$2"; shift 2
  if ! can_prompt; then printf '%s' "$default"; return; fi
  local reply opt
  while true; do
    printf '%s [%s] (default: %s): ' "$prompt" "$(IFS=/; printf '%s' "$*")" "$default" >&2
    read -r reply || reply=""
    reply="${reply:-$default}"
    for opt in "$@"; do
      if [[ "$(lower "$reply")" = "$(lower "$opt")" ]]; then
        printf '%s' "$opt"; return
      fi
    done
    printf 'Please pick one of: %s\n' "$*" >&2
  done
}

# ask <prompt> <default> -> prints the free-text reply (default when no terminal)
ask() {
  local prompt="$1" default="$2" reply
  if ! can_prompt; then printf '%s' "$default"; return; fi
  printf '%s (default: %s): ' "$prompt" "$default" >&2
  read -r reply || reply=""
  printf '%s' "${reply:-$default}"
}

# ---------- JSON helpers (node is already required for npx) ----------

# json_merge <target-file> <source-file>: deep-merge source keys into target (arrays are unioned), never dropping other keys.
json_merge() {
  local target="$1" source="$2"
  node - "$target" "$source" <<'NODE'
const fs = require('fs');
const [target, source] = process.argv.slice(2);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => {
  for (const [k, v] of Object.entries(b)) {
    if (isObj(v) && isObj(a[k])) a[k] = merge(a[k], v);
    else if (Array.isArray(v) && Array.isArray(a[k])) a[k] = [...a[k], ...v.filter((x) => !a[k].some((y) => JSON.stringify(y) === JSON.stringify(x)))];
    else a[k] = v;
  }
  return a;
};
const current = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8') || '{}') : {};
fs.writeFileSync(target, JSON.stringify(merge(current, JSON.parse(fs.readFileSync(source, 'utf8'))), null, 2) + '\n');
NODE
}

# ---------- Claude Code platform ----------

# run_quiet <command>...: hide the command's output unless it fails
run_quiet() {
  local out status=0
  out="$("$@" 2>&1)" || status=$?
  if [[ "$status" -ne 0 ]]; then
    printf '%s\n' "$out" >&2
    return "$status"
  fi
}

# json_query <claude-subcommand...> -- <node-expression-on-l> <arg>
# Runs `claude <subcommand> --json` and evaluates a node expression over the parsed list `l`.
json_query() {
  local -a subcommand=()
  local word
  while [[ $# -gt 0 ]]; do
    word="$1"; shift
    [[ "$word" = -- ]] && break
    subcommand+=("$word")
  done
  local expr="$1" arg="$2"
  claude "${subcommand[@]}" --json </dev/null 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      let l = [];
      try { l = JSON.parse(s); } catch {}
      if (!Array.isArray(l)) l = [];
      const arg = process.argv[2];
      new Function("l", "arg", process.argv[1])(l, arg);
    });' "$expr" "$arg"
}

plugin_installed() { # plugin@marketplace
  local id="$1"
  json_query plugin list -- 'process.exit(l.some(p => p.id === arg) ? 0 : 1)' "$id"
}

plugin_version() { # plugin@marketplace
  local id="$1"
  json_query plugin list -- 'const p = l.find(p => p.id === arg); process.stdout.write(p && p.version ? p.version : "unknown")' "$id"
}

marketplace_registered() { # name
  local name="$1"
  json_query plugin marketplace list -- 'process.exit(l.some(m => m.name === arg) ? 0 : 1)' "$name"
}

ensure_marketplace() { # name source
  local name="$1" source="$2"
  marketplace_registered "$name" && return 0
  step "📍 Registering the '$name' marketplace..."
  run_quiet claude plugin marketplace add "$source" </dev/null
}

install_or_update_plugin() { # plugin@marketplace marketplace-source
  local id="$1" market_source="$2"
  ensure_marketplace "${id#*@}" "$market_source"
  if plugin_installed "$id"; then
    step "🔄 $id is already here, checking for a fresher version..."
    run_quiet claude plugin update "$id" </dev/null
  else
    step "🔌 Installing $id (this one can take a moment)..."
    run_quiet claude plugin install "$id" </dev/null
  fi
  local version
  version="$(plugin_version "$id")"
  ok "$id is on v$version"
  LAST_PLUGIN_VERSION="$version"
}

uninstall_plugin_if_present() { # plugin@marketplace label
  local id="$1" label="$2"
  plugin_installed "$id" || return 0
  step "🧹 Retiring $label ($id)..."
  run_quiet claude plugin uninstall "$id" </dev/null
}

list_personas() { # prints persona ids, one per line
  local d
  for d in "$REPO_DIR"/personas/*/; do
    [[ -d "$d" ]] && basename "$d"
  done
}

installed_personas() { # prints persona ids currently installed from the token-effort marketplace
  json_query plugin list -- 'for (const p of l) if (p.id && p.id.endsWith("@" + arg)) console.log(p.id.split("@")[0])' "$PERSONA_MARKETPLACE"
}

npx_skills_add() { # source skill
  local source="$1" skill="$2"
  step "📚 Copying skill '$skill'..."
  (cd "$REPO_DIR" && run_quiet npx --yes skills add "$source" --skill "$skill" -g -a claude-code --copy -y </dev/null)
}

setup_persona() {
  local saved choice
  saved="$(state_get persona)"

  local options=(Default) id
  while read -r id; do
    [[ -n "$id" ]] && options+=("$id")
  done < <(list_personas)

  if [[ -n "$PERSONA" ]]; then
    choice="$PERSONA"
  elif [[ -n "$saved" ]] && [[ "$RECONFIGURE" -eq 0 ]]; then
    choice="$saved"
  else
    choice="$(choose "Persona" "${saved:-Default}" "${options[@]}")"
  fi

  # normalise case against the known options
  local match="" opt
  for opt in "${options[@]}"; do
    [[ "$(lower "$opt")" = "$(lower "$choice")" ]] && match="$opt"
  done
  [[ -n "$match" ]] || die "unknown persona '$choice' (available: ${options[*]})"
  choice="$match"
  state_set persona "$choice"

  heading "🎭 Persona"
  local keep=""
  if [[ "$choice" = Default ]]; then
    step "Default (no costume, just the facts)"
  else
    step "$choice - putting on the costume"
    keep="$choice"
    install_or_update_plugin "$choice@$PERSONA_MARKETPLACE" "$REPO_DIR"
  fi
  local other
  while read -r other; do
    [[ -n "$other" ]] && [[ "$other" != "$keep" ]] || continue
    uninstall_plugin_if_present "$other@$PERSONA_MARKETPLACE" "the old persona '$other'"
  done < <(installed_personas)
  if [[ "$choice" = Default ]]; then
    note "🎭 Persona: Default"
  else
    note "🎭 Persona: $choice (v$LAST_PLUGIN_VERSION)"
  fi
}

# skillset_ids: prints the skill set ids, one per line
skillset_ids() {
  local id rest
  while read -r id rest; do printf '%s\n' "$id"; done < <(skillset_entries)
}

# choose_skillsets: fills CHOSEN_SKILLSETS from the flag, saved state or a prompt
choose_skillsets() {
  local -a known=()
  local id
  while read -r id; do known+=("$id"); done < <(skillset_ids)
  local all saved reply
  all="$(IFS=,; printf '%s' "${known[*]}")"
  saved="$(state_get skillsets)"

  if [[ -n "$SKILLSETS" ]]; then
    reply="$SKILLSETS"
  elif [[ -n "$saved" ]] && [[ "$RECONFIGURE" -eq 0 ]]; then
    reply="$saved"
  else
    reply="$(ask "Skill sets to install (comma-separated: $all, or 'all')" "${saved:-all}")"
  fi
  [[ "$(lower "$reply")" = all ]] && reply="$all"

  CHOSEN_SKILLSETS=()
  local wanted k match
  for wanted in ${reply//,/ }; do
    match=""
    for k in "${known[@]}"; do
      [[ "$(lower "$k")" = "$(lower "$wanted")" ]] && match="$k"
    done
    [[ -n "$match" ]] || die "unknown skill set '$wanted' (available: $all, all)"
    CHOSEN_SKILLSETS+=("$match")
  done
  [[ "${#CHOSEN_SKILLSETS[@]}" -gt 0 ]] || die "pick at least one skill set (available: $all, all)"
  state_set skillsets "$(IFS=,; printf '%s' "${CHOSEN_SKILLSETS[*]}")"
}

skillset_chosen() { # id
  local id="$1" c
  for c in "${CHOSEN_SKILLSETS[@]:-}"; do [[ "$c" = "$id" ]] && return 0; done
  return 1
}

setup_skillsets() {
  heading "🧰 Skill sets"
  local id plugin repo
  while read -r id plugin repo; do
    if skillset_chosen "$id"; then
      install_or_update_plugin "$plugin" "$repo"
      note "🧰 Skill set: $id ($plugin v$LAST_PLUGIN_VERSION)"
    else
      uninstall_plugin_if_present "$plugin" "the '$id' skill set"
    fi
  done < <(skillset_entries)
}

setup_skills() {
  heading "📚 Home-grown skills"
  local d name
  for d in "$REPO_DIR"/skills/*/; do
    [[ -f "$d/SKILL.md" ]] || continue
    name="$(basename "$d")"
    npx_skills_add "$REPO_DIR/skills" "$name"
    note "📚 Skill: $name"
  done
  ok "Skills installed"
}

# install_with_config_dir <source> <target> <config-dir>: write source to target, replacing $AI_CONFIG_DIR with config-dir
install_with_config_dir() {
  local source="$1" target="$2" config_dir="$3" content
  content="$(<"$source")"
  mkdir -p "$(dirname "$target")"
  printf '%s\n' "${content//\$AI_CONFIG_DIR/$config_dir}" > "$target"
}

setup_config() {
  heading "⚙️  Settings and instructions ($CLAUDE_DIR)"
  step "Merging settings and starter permissions (your own entries stay put)..."
  json_merge "$CLAUDE_DIR/settings.json" "$CONFIG_SRC/settings.json"
  ok "Settings merged"
  note "⚙️  Settings merged into $CLAUDE_DIR/settings.json"
  step "Installing instructions (AGENTS.md is replaced on every run)..."
  install_with_config_dir "$CONFIG_SRC/AGENTS.md" "$CLAUDE_DIR/AGENTS.md" "$CLAUDE_DIR"
  ok "Instructions installed"
  note "📜 Instructions in $CLAUDE_DIR/AGENTS.md"
  step "Installing working-convention docs (replaced on every run)..."
  local doc
  for doc in "$CONFIG_SRC"/docs/agents/*.md; do
    install_with_config_dir "$doc" "$CLAUDE_DIR/docs/agents/$(basename "$doc")" "$CLAUDE_DIR"
  done
  ok "Working-convention docs installed"
  note "📋 Issue-tracker and triage-label docs in $CLAUDE_DIR/docs/agents/"
}

check_prerequisites() {
  command -v claude >/dev/null || die "Can't find the claude CLI on your PATH. Install Claude Code first, then come back!"
  command -v node   >/dev/null || die "Can't find node on your PATH. It's needed for npx and the JSON edits."
  if [[ ! -d "$CLAUDE_DIR" ]]; then
    warn "$CLAUDE_DIR doesn't exist yet; creating it (run claude afterwards to log in)"
    mkdir -p "$CLAUDE_DIR"
  fi
}

# ---------- checks and summary ----------

warn_update_blockers() {
  local v
  for v in DISABLE_UPDATES DISABLE_AUTOUPDATER CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC; do
    [[ -n "${!v:-}" ]] && warn "$v is set; plugin auto-update is disabled unless FORCE_AUTOUPDATE_PLUGINS=1 is also set"
  done
  return 0
}

print_summary() {
  heading "🎉 All done! Here's what happened"
  local s
  for s in "${SUMMARY[@]:-}"; do [[ -n "$s" ]] && log "  - $s"; done
  heading "👉 Your next steps"
  for s in "${NEXT_STEPS[@]:-}"; do [[ -n "$s" ]] && log "  - $s"; done
  if skillset_chosen pstack; then
    log "  - Run /setup-pstack (re-run after big model changes)."
    log "  - Once per repo: /create-verification-skill"
  fi
  if skillset_chosen mattpocock; then
    log "  - Once per repo: /setup-matt-pocock-skills (accept only the domain docs)"
  fi
  log "  - Restart running sessions to pick up changes."
}

main() {
  parse_args "$@"
  log "$C_BOLD🪙 Token Effort: configuring Claude Code in $CLAUDE_DIR$C_RESET"
  log "$C_DIM   Safe to re-run any time. Re-running is how you update.$C_RESET"
  check_prerequisites
  warn_update_blockers
  choose_skillsets
  setup_config
  setup_persona
  setup_skillsets
  setup_skills
  print_summary
}

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then main "$@"; fi
