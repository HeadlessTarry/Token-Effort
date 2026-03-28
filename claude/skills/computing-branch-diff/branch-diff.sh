#!/usr/bin/env bash
# branch-diff.sh — compute the branch diff relative to its base
# Exit codes: 0 = success, 1 = base branch not detected (ask user), 2 = unexpected error
set -uo pipefail
trap 'echo "ERROR: unexpected failure at line $LINENO (exit $?)" >&2; exit 2' ERR

# --- Base branch detection ---

CURRENT=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")
BASE=""

# Step 1: upstream tracking branch — but only if it diverges from HEAD
if [ "$CURRENT" != "HEAD" ]; then
  UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null || true)
  if [ -n "$UPSTREAM" ]; then
    UPSTREAM_MERGE_BASE=$(git merge-base HEAD "$UPSTREAM" 2>/dev/null || true)
    HEAD_HASH=$(git rev-parse HEAD)
    if [ -n "$UPSTREAM_MERGE_BASE" ] && [ "$UPSTREAM_MERGE_BASE" != "$HEAD_HASH" ]; then
      BASE="$UPSTREAM"
    fi
    # If upstream tracks the same branch (merge-base == HEAD), skip it
  fi
fi

# Step 2: remote default branch via cached metadata (no network)
if [ -z "$BASE" ]; then
  DEFAULT_BRANCH=$(git remote show origin --no-fetch 2>/dev/null \
    | grep 'HEAD branch' | awk '{print $NF}' || true)
  if [ -n "$DEFAULT_BRANCH" ]; then
    BASE="origin/$DEFAULT_BRANCH"
  fi
fi

# Step 3: probe known default names
if [ -z "$BASE" ]; then
  if git rev-parse --verify origin/main &>/dev/null 2>&1; then
    BASE="origin/main"
  elif git rev-parse --verify origin/master &>/dev/null 2>&1; then
    BASE="origin/master"
  fi
fi

# Step 4: give up — caller must ask the user
if [ -z "$BASE" ]; then
  echo "ERROR: Could not detect base branch automatically. Please specify the branch to diff against (e.g. origin/main)." >&2
  exit 1
fi

# --- Merge base computation ---

MERGE_BASE=$(git merge-base HEAD "$BASE")
HEAD_HASH=$(git rev-parse HEAD)

echo "BASE=$BASE"
echo "MERGE_BASE=$MERGE_BASE"

if [ "$MERGE_BASE" = "$HEAD_HASH" ]; then
  echo "STATUS=empty"
  echo "MESSAGE=No commits on this branch relative to $BASE. Diff is empty."
  exit 0
fi

echo "STATUS=ok"

echo ""
echo "--- CHANGED_FILES ---"
git diff --name-only "$MERGE_BASE" HEAD

echo ""
echo "--- COMMITS ---"
git log --oneline "$MERGE_BASE"..HEAD

echo ""
echo "--- DIFF ---"
DIFF_OUTPUT=$(git diff "$MERGE_BASE" HEAD)
LINE_COUNT=$(printf '%s\n' "$DIFF_OUTPUT" | wc -l)

if [ "$LINE_COUNT" -gt 1000 ]; then
  TMPFILE=$(mktemp /tmp/branch-diff-XXXXXX.patch)
  printf '%s\n' "$DIFF_OUTPUT" > "$TMPFILE"
  echo "LARGE_DIFF_FILE=$TMPFILE"
  echo "(Diff is $LINE_COUNT lines — written to temp file above)"
else
  printf '%s\n' "$DIFF_OUTPUT"
fi
