#!/usr/bin/env bash
# opencode.json manipulation helpers (bash)

# Create a timestamped backup of opencode.json
# Args: $1=config_path (e.g. ~/.config/opencode/opencode.json)
# Prints backup path on success
config_backup() {
    local config_path="$1"
    if [[ ! -f "$config_path" ]]; then
        echo "  No existing config to backup"
        return 0
    fi
    local timestamp
    timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    local backup_path="${config_path}.bak.${timestamp}"
    cp "$config_path" "$backup_path"
    echo "  Backup created: $backup_path"
}

# Read current plugins array from opencode.json
# Args: $1=config_path
# Outputs JSON array of plugins (empty array if file missing or no plugins key)
config_read_plugins() {
    local config_path="$1"
    if [[ ! -f "$config_path" ]]; then
        echo "[]"
        return 0
    fi
    if ! jq empty "$config_path" 2>/dev/null; then
        echo "Error: Invalid JSON in $config_path — aborting. Fix the JSON or delete the file to let the installer recreate it." >&2
        return 1
    fi
    jq -c '.plugin // []' "$config_path"
}

# Check if a plugin spec already exists in the plugins array
# Args: $1=plugins_json (JSON array), $2=plugin_spec (string to match)
# Returns 0 if found, 1 if not
config_has_plugin() {
    local plugins_json="$1"
    local plugin_spec="$2"
    local count
    count=$(echo "$plugins_json" | jq --arg spec "$plugin_spec" '[.[] | select(. == $spec)] | length')
    [[ "$count" -gt 0 ]]
}

# Add plugins to opencode.json
# Args: $1=config_path, $2+= plugin specs to add (one per arg)
# Backs up config before modifying. Validates JSON after write.
config_apply_plugins() {
    local config_path="$1"
    shift
    local specs=("$@")

    if [[ ${#specs[@]} -eq 0 ]]; then
        return 0
    fi

    # Read current plugins
    local current_plugins
    current_plugins=$(config_read_plugins "$config_path") || return 1

    # Build list of new plugins to add
    local new_specs=()
    for spec in "${specs[@]}"; do
        if config_has_plugin "$current_plugins" "$spec"; then
            echo "  Plugin already present: $spec (skipping)"
        else
            new_specs+=("$spec")
        fi
    done

    if [[ ${#new_specs[@]} -eq 0 ]]; then
        echo "  All plugins already configured — no changes needed"
        return 0
    fi

    # Show what will be added
    echo "  Plugins to add:"
    for spec in "${new_specs[@]}"; do
        echo "    + $spec"
    done

    # Backup
    config_backup "$config_path"

    # Build updated JSON
    local updated
    if [[ ! -f "$config_path" ]]; then
        updated='{"plugin":[]}'
    else
        updated=$(cat "$config_path")
    fi

    # Ensure plugins array exists
    if ! echo "$updated" | jq -e '.plugin' >/dev/null 2>&1; then
        updated=$(echo "$updated" | jq '. + {"plugin":[]}')
    fi

    # Append each new plugin
    for spec in "${new_specs[@]}"; do
        updated=$(echo "$updated" | jq --arg s "$spec" '.plugin += [$s]')
    done

    # Write
    echo "$updated" > "$config_path"

    # Validate
    if ! jq empty "$config_path" 2>/dev/null; then
        echo "Error: Failed to write valid JSON to $config_path" >&2
        return 1
    fi

    echo "  Config updated successfully"
    return 0
}
