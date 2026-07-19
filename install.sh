#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
    echo "Usage: install.sh [--local] [--skill <name>] [--agent <name>] [--update]"
    echo ""
    echo "Options:"
    echo "  --local        Install to .opencode/ instead of ~/.config/opencode/"
    echo "  --skill <name> Install only the specified skill"
    echo "  --agent <name> Install only the specified agent"
    echo "  --update       Pull latest for each vendor repo"
    echo "  --help         Show this help message"
    echo ""
    echo "If no --skill or --agent is specified, all skills and agents are installed."
}

# Defaults
DEST="$HOME/.config/opencode"
INSTALL_SKILL=""
INSTALL_AGENT=""
SHOULD_UPDATE="false"

# Parse flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --local)
            DEST="$(pwd)/.opencode"
            shift
            ;;
        --skill)
            if [[ -z "${2:-}" ]]; then
                echo "Error: --skill requires a name argument" >&2
                usage >&2
                exit 1
            fi
            INSTALL_SKILL="$2"
            shift 2
            ;;
        --agent)
            if [[ -z "${2:-}" ]]; then
                echo "Error: --agent requires a name argument" >&2
                usage >&2
                exit 1
            fi
            INSTALL_AGENT="$2"
            shift 2
            ;;
        --update)
            SHOULD_UPDATE="true"
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Error: Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

# Check prerequisites
for cmd in jq git; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "Error: $cmd is not installed." >&2
        exit 1
    fi
done

# Source helpers
source "$SCRIPT_DIR/lib/vendor.sh"
source "$SCRIPT_DIR/lib/config.sh"

# --- Vendor processing ---

VENDOR_DIR="$SCRIPT_DIR/.vendor"
MANIFEST="$SCRIPT_DIR/vendor.json"
PLUGIN_SPECS=()

if [[ -f "$MANIFEST" ]]; then
    echo "Processing vendor manifest..."

    while IFS='|' read -r type name repo spec extract_skills; do
        echo ""
        echo "Vendor: $name ($type)"

        # Clone or update
        if ! vendor_clone_or_update "$VENDOR_DIR" "$name" "$repo" "$SHOULD_UPDATE"; then
            echo "Failed to process vendor '$name'"
            read -rp "Retry? (r)etry / (s)kip / (a)bort: " choice
            case "$choice" in
                r|R)
                    if ! vendor_clone_or_update "$VENDOR_DIR" "$name" "$repo" "$SHOULD_UPDATE"; then
                        echo "Aborting." >&2
                        exit 1
                    fi
                    ;;
                s|S)
                    echo "  Skipping vendor '$name'"
                    continue
                    ;;
                *)
                    echo "Unrecognized choice '$choice' — aborting." >&2
                    exit 1
                    ;;
            esac
        fi

        # Queue plugins
        if [[ "$type" == "plugin" ]] && [[ -n "$spec" ]]; then
            PLUGIN_SPECS+=("$spec")
        fi

        # Copy vendor skills
        if [[ "$type" == "skill" ]] && [[ -n "$extract_skills" ]]; then
            IFS=',' read -ra skill_list <<< "$extract_skills"
            for skill_name in "${skill_list[@]}"; do
                local_source="$VENDOR_DIR/$name/skills/$skill_name"
                if [[ -d "$local_source" ]]; then
                    cp -r "$local_source" "$DEST/skills/"
                    echo "  Copied skill: $skill_name"
                else
                    echo "  Warning: skill '$skill_name' not found in vendor '$name'"
                    read -rp "  Skip this skill and continue? (y/n): " skip_choice
                    if [[ "$skip_choice" != "y" && "$skip_choice" != "Y" ]]; then
                        echo "Aborting." >&2
                        exit 1
                    fi
                fi
            done
        fi
    done < <(vendor_load_manifest "$MANIFEST")

    # Process plugin queue
    if [[ ${#PLUGIN_SPECS[@]} -gt 0 ]]; then
        echo ""
        echo "Updating opencode.json plugins..."
        CONFIG_PATH="$DEST/opencode.json"
        mkdir -p "$DEST"

        echo "  Proposed changes:"
        for spec in "${PLUGIN_SPECS[@]}"; do
            echo "    + $spec"
        done

        read -rp "  Apply these changes? (y/n): " confirm
        if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
            config_apply_plugins "$CONFIG_PATH" "${PLUGIN_SPECS[@]}"
        else
            echo "  Skipping opencode.json update"
        fi
    fi
fi

# --- Own skills/agents install ---

echo ""
echo "Installing Token-Effort skills and agents..."
mkdir -p "$DEST/skills" "$DEST/agents"

if [[ -n "$INSTALL_SKILL" ]] && [[ -n "$INSTALL_AGENT" ]]; then
    echo "Error: --skill and --agent are mutually exclusive" >&2
    usage >&2
    exit 1
elif [[ -n "$INSTALL_SKILL" ]]; then
    if [[ "$INSTALL_SKILL" == *..* ]] || [[ "$INSTALL_SKILL" == /* ]]; then
        echo "Error: Invalid skill name: $INSTALL_SKILL" >&2
        exit 1
    fi
    if [[ -d "$SCRIPT_DIR/skills/$INSTALL_SKILL" ]]; then
        cp -r "$SCRIPT_DIR/skills/$INSTALL_SKILL" "$DEST/skills/"
        echo "  Synced skills/$INSTALL_SKILL -> $DEST/skills/$INSTALL_SKILL"
    else
        echo "Error: Skill not found: $INSTALL_SKILL" >&2
        exit 1
    fi
elif [[ -n "$INSTALL_AGENT" ]]; then
    if [[ "$INSTALL_AGENT" == *..* ]] || [[ "$INSTALL_AGENT" == /* ]]; then
        echo "Error: Invalid agent name: $INSTALL_AGENT" >&2
        exit 1
    fi
    if [[ -f "$SCRIPT_DIR/agents/$INSTALL_AGENT.md" ]]; then
        cp "$SCRIPT_DIR/agents/$INSTALL_AGENT.md" "$DEST/agents/"
        echo "  Synced agents/$INSTALL_AGENT.md -> $DEST/agents/$INSTALL_AGENT.md"
    else
        echo "Error: Agent not found: $INSTALL_AGENT" >&2
        exit 1
    fi
else
    for dir in skills agents; do
        if [[ -d "$SCRIPT_DIR/$dir" ]] && [[ "$(ls -A "$SCRIPT_DIR/$dir" 2>/dev/null)" ]]; then
            cp -r "$SCRIPT_DIR/$dir"/. "$DEST/$dir/"
            echo "  Synced $dir/ -> $DEST/$dir/"
        fi
    done
fi

echo ""
echo "Done. Restart OpenCode to pick up changes."
