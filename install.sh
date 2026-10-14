#!/usr/bin/env bash
# Token-Effort installer: configures Claude Code in ~/.claude (or $CLAUDE_CONFIG_DIR).
# Safe to re-run; running it again is how updates happen.
#
# Usage: ./install.sh [--overhaul <id|none>] [--skills <id,...|all>] [--reconfigure]
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$REPO_DIR/plugins/claude/token-effort"
MODS_DIR="$REPO_DIR/plugins/claude/overhaul-mods"
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
OVERHAUL_MARKETPLACE="token-effort"
CORE_PLUGIN="token-effort@$OVERHAUL_MARKETPLACE"
# Third-party skill sets offered at install, one per line: <id> <plugin>@<marketplace> <github-repo>
SKILLSETS_AVAILABLE="mattpocock mattpocock-skills@mattpocock mattpocock/skills
pstack pstack@pstack-claude michael-denyer/pstack-claude"

OVERHAUL="" SKILLSETS="" RECONFIGURE=0
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
      --overhaul)    OVERHAUL="${value:?--overhaul needs a value}"; shift 2 ;;
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

plugin_version() { # plugin@marketplace -> "v<version>", or "unversioned" for a plugin that tracks commits
  local id="$1"
  json_query plugin list -- 'const p = l.find(p => p.id === arg); process.stdout.write(p && p.version && p.version !== "unknown" ? "v" + p.version : "unversioned")' "$id"
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
  ok "$id is installed ($version)"
  LAST_PLUGIN_VERSION="$version"
}

uninstall_plugin_if_present() { # plugin@marketplace label
  local id="$1" label="$2"
  plugin_installed "$id" || return 0
  step "🧹 Retiring $label ($id)..."
  run_quiet claude plugin uninstall "$id" </dev/null
}

list_overhaul_mods() { # prints overhaul mod ids, one per line
  local d
  for d in "$MODS_DIR"/*/; do
    [[ -d "$d" ]] && basename "$d"
  done
}

installed_overhaul_mods() { # prints overhaul mod ids installed from the token-effort marketplace (every plugin there but the core one)
  json_query plugin list -- 'for (const p of l) if (p.id && p.id !== arg && p.id.endsWith(arg.slice(arg.indexOf("@")))) console.log(p.id.split("@")[0])' "$CORE_PLUGIN"
}

setup_overhaul() {
  local saved choice
  saved="$(state_get overhaul)"

  local options=(none) id
  while read -r id; do
    [[ -n "$id" ]] && options+=("$id")
  done < <(list_overhaul_mods)

  if [[ -n "$OVERHAUL" ]]; then
    choice="$OVERHAUL"
  elif [[ -n "$saved" ]] && [[ "$RECONFIGURE" -eq 0 ]]; then
    choice="$saved"
  else
    choice="$(choose "Overhaul mod" "${saved:-none}" "${options[@]}")"
  fi

  # normalise case against the known options
  local match="" opt
  for opt in "${options[@]}"; do
    [[ "$(lower "$opt")" = "$(lower "$choice")" ]] && match="$opt"
  done
  [[ -n "$match" ]] || die "unknown overhaul mod '$choice' (available: ${options[*]})"
  choice="$match"
  state_set overhaul "$choice"

  heading "🎭 Overhaul mod"
  local keep=""
  if [[ "$choice" = none ]]; then
    step "none (plain Claude Code, just the facts)"
  else
    step "$choice - bolting on the whole overhaul"
    keep="$choice"
    install_or_update_plugin "$choice@$OVERHAUL_MARKETPLACE" "$REPO_DIR"
  fi
  local other
  while read -r other; do
    [[ -n "$other" ]] && [[ "$other" != "$keep" ]] || continue
    uninstall_plugin_if_present "$other@$OVERHAUL_MARKETPLACE" "the old overhaul mod '$other'"
  done < <(installed_overhaul_mods)
  if [[ "$choice" = none ]]; then
    note "🎭 Overhaul mod: none"
  else
    note "🎭 Overhaul mod: $choice ($LAST_PLUGIN_VERSION)"
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
      note "🧰 Skill set: $id ($plugin $LAST_PLUGIN_VERSION)"
    else
      uninstall_plugin_if_present "$plugin" "the '$id' skill set"
    fi
  done < <(skillset_entries)
}

# remove_legacy <path>: delete a file or directory an older install copied in, when present
remove_legacy() {
  local path="$1"
  [[ -e "$path" ]] || return 0
  rm -rf -- "$path"
  step "🧹 Removed $path"
}

# migrate_legacy_install: delete the copies older installs made of what the core plugin now ships
migrate_legacy_install() {
  heading "🧹 Older install"
  remove_legacy "$CLAUDE_DIR/AGENTS.md"
  remove_legacy "$CLAUDE_DIR/docs/agents/issue-tracker.md"
  remove_legacy "$CLAUDE_DIR/docs/agents/triage-labels.md"
  local d
  for d in "$REPO_DIR"/skills/*/; do
    [[ -d "$d" ]] && remove_legacy "$CLAUDE_DIR/skills/$(basename "$d")"
  done
  ok "No copies left from older installs"
}

setup_core() {
  heading "🪙 Core plugin"
  install_or_update_plugin "$CORE_PLUGIN" "$REPO_DIR"
  note "🪙 Core plugin: $CORE_PLUGIN ($LAST_PLUGIN_VERSION), with the home-grown skills and working conventions"
}

setup_config() {
  heading "⚙️  Settings ($CLAUDE_DIR)"
  step "Merging settings and starter permissions (your own entries stay put)..."
  node "$CORE_DIR/scripts/merge-settings.js" "$CLAUDE_DIR/settings.json" "$CORE_DIR/config/settings.json"
  ok "Settings merged"
  note "⚙️  Settings merged into $CLAUDE_DIR/settings.json"
}

check_prerequisites() {
  command -v claude >/dev/null || die "Can't find the claude CLI on your PATH. Install Claude Code first, then come back!"
  command -v node   >/dev/null || die "Can't find node on your PATH. It's needed for the core plugin's hooks and the settings merge."
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
  migrate_legacy_install
  setup_core
  setup_overhaul
  setup_skillsets
  # last, because registering a marketplace rewrites its extraKnownMarketplaces entry
  setup_config
  print_summary
}

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then main "$@"; fi
