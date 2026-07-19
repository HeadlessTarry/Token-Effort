#!/usr/bin/env bash
# Vendor repo management helpers (bash)

# Parse vendor.json and output vendor entries as lines:
#   type|name|repo|opencode_plugin_spec|extract_skills
# where type is "plugin" or "skill", and extract_skills is comma-separated (may be empty)
vendor_load_manifest() {
    local manifest="$1"
    if [[ ! -f "$manifest" ]]; then
        echo "Error: vendor manifest not found: $manifest" >&2
        return 1
    fi

    # Plugins
    local plugin_count
    plugin_count=$(jq '.plugins | length' "$manifest")
    local i=0
    while [[ $i -lt $plugin_count ]]; do
        local name repo spec
        name=$(jq -r ".plugins[$i].name" "$manifest")
        repo=$(jq -r ".plugins[$i].repo" "$manifest")
        spec=$(jq -r ".plugins[$i].opencode_plugin_spec" "$manifest")
        echo "plugin|$name|$repo|$spec|"
        i=$((i + 1))
    done

    # Skills
    local skill_count
    skill_count=$(jq '.skills | length' "$manifest")
    local j=0
    while [[ $j -lt $skill_count ]]; do
        local name repo extract
        name=$(jq -r ".skills[$j].name" "$manifest")
        repo=$(jq -r ".skills[$j].repo" "$manifest")
        extract=$(jq -r ".skills[$j].extract_skills | join(\",\")" "$manifest")
        echo "skill|$name|$repo||$extract"
        j=$((j + 1))
    done
}

# Clone or update a vendor repo
# Args: $1=vendor_dir (e.g. .vendor), $2=name, $3=repo_url, $4=should_update (true/false)
# Returns 0 on success, 1 on failure
vendor_clone_or_update() {
    local vendor_dir="$1"
    local name="$2"
    local repo_url="$3"
    local should_update="$4"
    local target="$vendor_dir/$name"

    if [[ ! -d "$target" ]]; then
        echo "  Cloning $name → $target"
        if ! git clone --depth 1 "$repo_url" "$target" 2>&1; then
            echo "Error: Failed to clone vendor '$name'" >&2
            return 1
        fi
    elif [[ "$should_update" == "true" ]]; then
        echo "  Updating $name"
        if ! git -C "$target" pull 2>&1; then
            echo "Error: Failed to update vendor '$name'" >&2
            return 1
        fi
    else
        echo "  Vendor '$name' already cloned (use --update to pull latest)"
    fi
    return 0
}
