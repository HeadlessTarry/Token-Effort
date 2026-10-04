#!/usr/bin/env bash
# Token-Effort installer: sets up the Lab and Forge agent areas.
# Safe to re-run; running it again is how updates happen.
#
# Usage: ./install.sh [--persona-lab <name>] [--persona-forge <name>]
#                     [--ide <none|zed>] [--reconfigure]
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AREAS=(lab forge)
PERSONA_MARKETPLACE="token-effort"
PROFILE_BEGIN="# >>> token-effort >>>"
PROFILE_END="# <<< token-effort <<<"

PERSONA_LAB="" PERSONA_FORGE="" IDE="" RECONFIGURE=0
SUMMARY=()
NEXT_STEPS=()

log()  { printf '%s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }
die()  { printf 'error: %s\n' "$*" >&2; exit 1; }
note() { SUMMARY+=("$*"); }

area_dir() { printf '%s/.claude-%s' "$HOME" "$1"; }
area_title() { local a="$1"; printf '%s%s' "$(printf '%s' "${a:0:1}" | tr '[:lower:]' '[:upper:]')" "${a:1}"; }

usage() {
  sed -n '2,6p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --persona-lab)   PERSONA_LAB="${2:?--persona-lab needs a value}"; shift 2 ;;
      --persona-forge) PERSONA_FORGE="${2:?--persona-forge needs a value}"; shift 2 ;;
      --ide)           IDE="${2:?--ide needs a value}"; shift 2 ;;
      --reconfigure)   RECONFIGURE=1; shift ;;
      -h|--help)       usage; exit 0 ;;
      *) usage >&2; die "unknown argument: $1" ;;
    esac
  done
}

# ---------- state (per-area key=value file) ----------

state_file() { printf '%s/.install-state' "$(area_dir "$1")"; }

state_get() { # area key
  local f; f="$(state_file "$1")"
  [ -f "$f" ] || return 0
  sed -n "s/^$2=//p" "$f" | tail -n 1
}

state_set() { # area key value
  local f tmp; f="$(state_file "$1")"; tmp="$f.tmp"
  mkdir -p "$(dirname "$f")"
  { [ -f "$f" ] && grep -v "^$2=" "$f" || true; printf '%s=%s\n' "$2" "$3"; } > "$tmp"
  mv "$tmp" "$f"
}

# ---------- prompts ----------

can_prompt() { [ -t 0 ]; }

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
      if [ "$(printf '%s' "$reply" | tr '[:upper:]' '[:lower:]')" = "$(printf '%s' "$opt" | tr '[:upper:]' '[:lower:]')" ]; then
        printf '%s' "$opt"; return
      fi
    done
    printf 'Please pick one of: %s\n' "$*" >&2
  done
}

# ---------- JSON helpers (node is already required for npx) ----------

# json_merge <target-file> <source-file>: deep-merge source keys into target, never overwriting other keys.
json_merge() {
  node - "$1" "$2" <<'NODE'
const fs = require('fs');
const [target, source] = process.argv.slice(2);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => {
  for (const [k, v] of Object.entries(b)) a[k] = isObj(v) && isObj(a[k]) ? merge(a[k], v) : v;
  return a;
};
const current = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8') || '{}') : {};
fs.writeFileSync(target, JSON.stringify(merge(current, JSON.parse(fs.readFileSync(source, 'utf8'))), null, 2) + '\n');
NODE
}

# ---------- Claude Code platform ----------

claude_area() { CLAUDE_CONFIG_DIR="$(area_dir "$1")" "${@:2}"; }

plugin_installed() { # area plugin@marketplace
  claude_area "$1" claude plugin list --json 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const l = JSON.parse(s); process.exit((Array.isArray(l)?l:[]).some(p => p.id === process.argv[1]) ? 0 : 1); }
      catch { process.exit(1); }
    });' "$2"
}

plugin_version() { # area plugin@marketplace
  claude_area "$1" claude plugin list --json 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const p = JSON.parse(s).find(p => p.id === process.argv[1]); process.stdout.write(p && p.version ? p.version : "unknown"); }
      catch { process.stdout.write("unknown"); }
    });' "$2"
}

marketplace_registered() { # area name
  claude_area "$1" claude plugin marketplace list --json 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const l = JSON.parse(s); process.exit((Array.isArray(l)?l:[]).some(m => m.name === process.argv[1]) ? 0 : 1); }
      catch { process.exit(1); }
    });' "$2"
}

ensure_marketplace() { # area name source
  marketplace_registered "$1" "$2" && return 0
  claude_area "$1" claude plugin marketplace add "$3" >/dev/null
}

install_or_update_plugin() { # area plugin@marketplace marketplace-name marketplace-source
  local area="$1" id="$2"
  ensure_marketplace "$area" "$3" "$4"
  if plugin_installed "$area" "$id"; then
    claude_area "$area" claude plugin update "$id" >/dev/null
  else
    claude_area "$area" claude plugin install "$id" >/dev/null
  fi
  note "$(area_title "$area"): plugin $id $(plugin_version "$area" "$id")"
}

list_personas() { # prints persona ids, one per line
  local d
  for d in "$REPO_DIR"/personas/*/; do
    [ -d "$d" ] && basename "$d"
  done
}

installed_personas() { # area -> persona ids currently installed from the token-effort marketplace
  claude_area "$1" claude plugin list --json 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { for (const p of JSON.parse(s)) if (p.id && p.id.endsWith("@" + process.argv[1])) console.log(p.id.split("@")[0]); }
      catch {}
    });' "$PERSONA_MARKETPLACE"
}

# warn_duplicate_skills <area>: individual skills that duplicate an installed plugin of the same repo
warn_duplicate_skills() {
  local area="$1" manifest="$REPO_DIR/areas/$1/manifest" kind a b
  local plugin_repos=()
  while read -r kind a b; do
    [ "$kind" = plugin ] && plugin_repos+=("$b")
  done < <(grep -v '^[[:space:]]*#' "$manifest" | grep -v '^[[:space:]]*$')
  while read -r kind a b; do
    [ "$kind" = extskill ] || continue
    local r
    for r in "${plugin_repos[@]:-}"; do
      [ "$r" = "$a" ] && warn "$area: skill '$b' from $a is also covered by that repo's plugin; you will get two copies"
    done
  done < <(grep -v '^[[:space:]]*#' "$manifest" | grep -v '^[[:space:]]*$')
}

npx_skills_add() { # area source skill
  local dir; dir="$(area_dir "$1")"
  (cd "$REPO_DIR" && CLAUDE_CONFIG_DIR="$dir" XDG_STATE_HOME="$dir/.skills-state" \
    npx --yes skills add "$2" --skill "$3" -g -a claude-code --copy -y >/dev/null)
}

setup_persona() { # area
  local area="$1" flag_val saved choice
  case "$area" in lab) flag_val="$PERSONA_LAB" ;; forge) flag_val="$PERSONA_FORGE" ;; esac
  saved="$(state_get "$area" persona)"

  local options=(Default) id
  while read -r id; do
    [ -n "$id" ] && options+=("$id")
  done < <(list_personas)

  if [ -n "$flag_val" ]; then
    choice="$flag_val"
  elif [ -n "$saved" ] && [ "$RECONFIGURE" -eq 0 ]; then
    choice="$saved"
  else
    choice="$(choose "Persona for $(area_title "$area")" "${saved:-Default}" "${options[@]}")"
  fi

  # normalise case against the known options
  local match="" opt
  for opt in "${options[@]}"; do
    [ "$(printf '%s' "$opt" | tr '[:upper:]' '[:lower:]')" = "$(printf '%s' "$choice" | tr '[:upper:]' '[:lower:]')" ] && match="$opt"
  done
  [ -n "$match" ] || die "unknown persona '$choice' (available: ${options[*]})"
  choice="$match"
  state_set "$area" persona "$choice"

  local keep=""
  if [ "$choice" != Default ]; then
    keep="$choice"
    install_or_update_plugin "$area" "$choice@$PERSONA_MARKETPLACE" "$PERSONA_MARKETPLACE" "$REPO_DIR"
  fi
  local other
  while read -r other; do
    [ -n "$other" ] && [ "$other" != "$keep" ] && claude_area "$area" claude plugin uninstall "$other@$PERSONA_MARKETPLACE" >/dev/null
  done < <(installed_personas "$area")
  note "$(area_title "$area"): persona $choice"
}

setup_area() { # area
  local area="$1" dir manifest kind a b
  dir="$(area_dir "$area")"
  manifest="$REPO_DIR/areas/$area/manifest"
  mkdir -p "$dir"
  json_merge "$dir/settings.json" "$REPO_DIR/areas/$area/settings.json"
  note "$(area_title "$area"): settings merged into $dir/settings.json"

  setup_persona "$area"
  warn_duplicate_skills "$area"

  while read -r kind a b; do
    case "$kind" in
      plugin)
        install_or_update_plugin "$area" "$a" "${a#*@}" "$b" ;;
      skill)
        npx_skills_add "$area" "$REPO_DIR/skills" "$a"
        note "$(area_title "$area"): skill $a" ;;
      extskill)
        npx_skills_add "$area" "$a" "$b"
        note "$(area_title "$area"): skill $b (from $a)" ;;
      *) warn "ignoring unknown manifest entry '$kind' in $manifest" ;;
    esac
  done < <(grep -v '^[[:space:]]*#' "$manifest" | grep -v '^[[:space:]]*$')

  if [ ! -f "$dir/.credentials.json" ]; then
    NEXT_STEPS+=("Run claude-$area and log in (not logged in yet).")
  fi
}

install_claude_code() {
  command -v claude >/dev/null || die "claude CLI not found on PATH"
  command -v node   >/dev/null || die "node not found on PATH (needed for npx and JSON edits)"
  local area
  for area in "${AREAS[@]}"; do
    setup_area "$area"
  done
}

# ---------- shell functions ----------

write_shell_functions() {
  local profile="${TOKEN_EFFORT_PROFILE:-$HOME/.bashrc}"
  local block
  block="$PROFILE_BEGIN
claude-lab()   { CLAUDE_CONFIG_DIR=\"\$HOME/.claude-lab\" claude \"\$@\"; }
claude-forge() { CLAUDE_CONFIG_DIR=\"\$HOME/.claude-forge\" claude \"\$@\"; }
$PROFILE_END"
  touch "$profile"
  # Git Bash login shells read ~/.bash_profile; make sure it sources ~/.bashrc
  if [ -z "${TOKEN_EFFORT_PROFILE:-}" ] && [ -f "$HOME/.bash_profile" ] && ! grep -q bashrc "$HOME/.bash_profile"; then
    warn "~/.bash_profile does not source ~/.bashrc; the claude-lab/claude-forge functions may not load in login shells"
  fi
  local tmp="$profile.token-effort.tmp"
  awk -v b="$PROFILE_BEGIN" -v e="$PROFILE_END" '
    $0 == b { skip = 1; next }
    $0 == e { skip = 0; next }
    !skip
  ' "$profile" > "$tmp"
  printf '%s\n' "$block" >> "$tmp"
  mv "$tmp" "$profile"
  note "Shell functions claude-lab and claude-forge written to $profile"
}

# ---------- IDEs ----------

zed_settings_path() {
  if [ -n "${TOKEN_EFFORT_ZED_SETTINGS:-}" ]; then printf '%s' "$TOKEN_EFFORT_ZED_SETTINGS"; return; fi
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) printf '%s/Zed/settings.json' "${APPDATA:-$HOME/AppData/Roaming}" ;;
    Darwin) printf '%s/.config/zed/settings.json' "$HOME" ;;
    *) printf '%s/zed/settings.json' "${XDG_CONFIG_HOME:-$HOME/.config}" ;;
  esac
}

configure_ide_zed() {
  local settings npx_cmd=npx
  settings="$(zed_settings_path)"
  case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) npx_cmd=npx.cmd ;; esac
  mkdir -p "$(dirname "$settings")"
  local rc=0 home_native="$HOME"
  command -v cygpath >/dev/null && home_native="$(cygpath -m "$HOME")"
  node - "$settings" "$home_native" "$npx_cmd" <<'NODE' || rc=$?
const fs = require('fs');
const [file, home, npx] = process.argv.slice(2);
const strip = (t) => { // remove // and /* */ comments (outside strings) and trailing commas
  let out = '', i = 0, str = false;
  while (i < t.length) {
    const c = t[i], n = t[i + 1];
    if (str) { out += c; if (c === '\\') { out += n; i += 2; continue; } if (c === '"') str = false; i++; continue; }
    if (c === '"') { str = true; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < t.length && t[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < t.length && !(t[i] === '*' && t[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
};
const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const hasComments = strip(raw) !== raw.replace(/,(\s*[}\]])/g, '$1');
const entry = (area) => ({ type: 'custom', command: npx, args: ['-y', '@agentclientprotocol/claude-agent-acp@latest'], env: { CLAUDE_CONFIG_DIR: `${home}/.claude-${area}` } });
const servers = { 'Claude Lab': entry('lab'), 'Claude Forge': entry('forge') };
if (hasComments) {
  console.error(`Zed settings at ${file} contain comments, so they were left untouched.`);
  console.error('Add this under "agent_servers" by hand:');
  console.error(JSON.stringify(servers, null, 2));
  process.exit(3);
}
const cfg = raw.trim() ? JSON.parse(strip(raw)) : {};
cfg.agent_servers = Object.assign(cfg.agent_servers || {}, servers);
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
NODE
  if [ "$rc" -eq 0 ]; then
    note "Zed: Claude Lab and Claude Forge agents configured in $settings"
  else
    note "Zed: settings contain comments; snippet printed above for manual edit"
  fi
}

configure_ide() {
  local saved choice
  saved="$(state_get lab ide)"
  if [ -n "$IDE" ]; then choice="$IDE"
  elif [ -n "$saved" ] && [ "$RECONFIGURE" -eq 0 ]; then choice="$saved"
  else choice="$(choose "Configure IDE agents?" "${saved:-none}" none zed)"; fi
  state_set lab ide "$choice"
  case "$choice" in
    none) note "IDE: none" ;;
    zed)  configure_ide_zed || true ;;
    *)    die "unknown IDE '$choice' (available: none, zed)" ;;
  esac
}

# ---------- checks and summary ----------

warn_update_blockers() {
  local v
  for v in DISABLE_UPDATES DISABLE_AUTOUPDATER CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC; do
    [ -n "${!v:-}" ] && warn "$v is set; plugin auto-update is disabled unless FORCE_AUTOUPDATE_PLUGINS=1 is also set"
  done
  return 0
}

print_summary() {
  log ""
  log "== What was done =="
  local s; for s in "${SUMMARY[@]}"; do log "  - $s"; done
  log ""
  log "== Next steps =="
  for s in "${NEXT_STEPS[@]:-}"; do [ -n "$s" ] && log "  - $s"; done
  log "  - Once in Forge: run /setup-pstack (re-run after big model changes)."
  log "  - Once per repo, in a Lab session: /setup-matt-pocock-skills"
  log "  - Once per repo, in a Forge session: /create-verification-skill"
  log "  - Restart running sessions and Zed threads to pick up changes."
}

main() {
  parse_args "$@"
  warn_update_blockers
  install_claude_code   # one step per platform; add install_opencode etc. here
  write_shell_functions
  configure_ide
  print_summary
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then main "$@"; fi
