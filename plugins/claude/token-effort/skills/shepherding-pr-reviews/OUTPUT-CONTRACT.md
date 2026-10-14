# 📜 review-state.js output contract

The `shepherding-pr-reviews` skill owns what `scripts/review-state.js` prints. Other tools read it and never shape it: the `under-empire` Doomwheel mod draws its heat and rounds from it.

## 🔒 Stable

These hold across releases. New fields may be added; none of these may be renamed or removed. `plugins/claude/token-effort/scripts/tests/review-state.test.js` pins them.

- The script is `scripts/review-state.js`, and its PR subcommands take `--repo owner/name --pr N`.
- `ingest` prints JSON with `action`, `instruction`, `noise_count`, `noise_limit`, `round_count`, `round_limit`, `rounds[].kind` and `rounds[].findings[].severity`.
- When `ingest` reaches a limit (`action` is `halt`), `instruction` begins with `Round limit` or `Noise limit`.
- `check` prints JSON with `pr_state`, `threads`, `pm_comments`, `waiting_on_user` and `human_review_in_progress`.

## 🔢 Values

| Field | Values |
|---|---|
| `action` | `handle`, `judge_severity`, `halt`, `copilot_error`, `format_drift`, `nothing` |
| `instruction` | A string for `halt`, `judge_severity`, `copilot_error` and `format_drift`; otherwise `null` |
| `rounds[].kind` | `first`, `human`, `signal`, `noise`, `carry_over`, `quiet`. Absent while `action` is `judge_severity` or `format_drift`, since nothing is recorded |
| `rounds[].reviewer` | `ai` or `human` |
| `rounds[].findings[].severity` | `High`, `Medium`, `Low`, or `null` for a human's finding with no badge |
| `noise_limit`, `round_limit` | `3` and `10` |
