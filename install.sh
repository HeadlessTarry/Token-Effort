#!/usr/bin/env bash
set -euo pipefail

usage() {
    echo "Usage: install.sh [--local] [--skill <name>] [--agent <name>]"
    echo ""
    echo "Options:"
    echo "  --local        Install to .opencode/ instead of ~/.config/opencode/"
    echo "  --skill <name> Install only the specified skill"
    echo "  --agent <name> Install only the specified agent"
    echo ""
    echo "If no --skill or --agent is specified, all skills and agents are installed."
}

# Defaults
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.config/opencode"
INSTALL_SKILL=""
INSTALL_AGENT=""

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
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed." >&2
    echo "Install jq: https://jqlang.github.io/jq/download/" >&2
    exit 1
fi

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
        echo "  Synced skills/$INSTALL_SKILL → $DEST/skills/$INSTALL_SKILL"
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
        echo "  Synced agents/$INSTALL_AGENT.md → $DEST/agents/$INSTALL_AGENT.md"
    else
        echo "Error: Agent not found: $INSTALL_AGENT" >&2
        exit 1
    fi
else
    # Install everything
    for dir in skills agents; do
        if [[ -d "$SCRIPT_DIR/$dir" ]] && [[ "$(ls -A "$SCRIPT_DIR/$dir" 2>/dev/null)" ]]; then
            cp -r "$SCRIPT_DIR/$dir"/. "$DEST/$dir/"
            echo "  Synced $dir/ → $DEST/$dir/"
        fi
    done
fi

echo "Done. Restart OpenCode to pick up changes."
