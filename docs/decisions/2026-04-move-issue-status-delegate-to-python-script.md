# 2026-04-move-issue-status-delegate-to-python-script

> **Status:** Active
> **Issue:** [#84 — Reduce token usage in move-issue-status skill](https://github.com/HeadlessTarry/Token-Effort/issues/84)
> **Date:** 2026-04-20

## 🧩 Context

The `move-issue-status` skill executed entirely as LLM reasoning — each `gh` CLI call was read and interpreted by the model. The skill's logic is fully deterministic (JSON parsing and conditional branching) and does not require LLM judgment at any step. This resulted in unnecessary token consumption on every invocation, which compounds across every skill that calls `move-issue-status` as a dependency.

## 🔀 Decision

Replace LLM-driven execution with a standalone Python script (`move_issue_status.py`) containing all deterministic logic. The skill becomes a three-phase thin wrapper: locate the script via `printenv CLAUDE_PLUGIN_ROOT`, run it with `python`, parse JSON stdout, and report the result. Token consumption per invocation drops to near zero for the skill's reasoning steps.

The script implements advance mode (silent-skip preconditions) and explicit mode (named status lookup, case-insensitive substring match to support emoji-prefixed column names) entirely in Python using `subprocess` to call `gh` CLI.

## ⚖️ Consequences

- Python 3 must be available in the execution environment (already required by the project's existing hooks).
- The script is self-contained and independently testable without Claude Code; a full unit test suite covers all skip/error/move paths.
- All callers of `move-issue-status` (e.g. `building-gh-issue`, `triaging-gh-issues`) benefit automatically from reduced token usage with no changes on their side.
- Status option matching uses case-insensitive substring matching to handle emoji-prefixed column names (e.g. `"Building"` matches `"🏗️ Building"`).
- Bugs in the script affect all callers rather than being isolated to a single LLM session — the unit test suite mitigates this risk.
- The `CLAUDE_PLUGIN_ROOT` injection contract is load-bearing: the skill will fail silently if the variable is not set by the runtime.
