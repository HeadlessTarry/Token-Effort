---
name: shepherding-pr-reviews
description: Run one review round on an open PR — give each review comment a verdict, fix the valid ones, reply in-thread, resolve, and prove every thread answered. Use after `gh pr create`, on a `<ci-monitor-event>`, when told PR reviews have landed, or when told to continue a halted PR.
---

# 🐑 Shepherding PR reviews

Round, Noise, Verdict, Auto-Fix Watch and Auto-Fix Halt are defined in [GLOSSARY.md](../../../../../GLOSSARY.md). Your round starts on one wake (a `<ci-monitor-event>`, the hook message after `gh pr create`, or the human saying reviews landed) and ends when `check` prints `"ok": true`.

Every command below runs the script with its subcommand and options:

    node "${CLAUDE_PLUGIN_ROOT}/plugins/claude/token-effort/skills/shepherding-pr-reviews/scripts/review-state.js" <subcommand> <options>

Each subcommand takes `--repo <owner/name> --pr <n>` plus its own options, except `reply`, which takes exactly `--thread <PRRT_id> --body-file <f> [--resolve]`. `--help` lists every subcommand.

## 🎯 1. Arm the Auto-Fix Watch (once per PR)

Right after `gh pr create`, a hook binds the PR to this session. Then:

- **Desktop app:** call `mcp__ccd_pr__set_monitor` with `auto_fix: true`, `address_comments: true` and the PR `url`.
- **CLI session** (no `mcp__ccd_pr__set_monitor`): tell the human the Auto-Fix Watch is not armed, and that you run a round when they say reviews have landed.

For a PR this session did not create with `gh pr create`, bind it once with `bind --session-id ${CLAUDE_SESSION_ID}` so the Stop hook guards it.

## 📥 2. Ingest the round

Run `ingest`. Its `action` decides the round:

- `handle`: work steps 3–6 on every finding in `rounds`, plus every unanswered thread and PR comment `check` reports.
- `judge_severity`: an AI reviewer's findings carry no severity badge. Judge each key in `rounds[].unknown_severity` as High, Medium or Low from the finding's content, then re-run `ingest` with `--assume <key>=<severity>` once per key.
- `halt`: the noise limit or the round limit is reached (an Auto-Fix Halt). Follow `instruction` exactly: turn Auto-Fix off, leave the findings as they are, and hand back in your final message with what is still open.
- `copilot_error`: Copilot failed to review. Tell the human to re-request the review; the failure is not a round. (`handle` with a `copilot_errors` list means: handle the round, and also tell the human.)
- `format_drift`: follow `instruction`.
- `nothing`: end the round.

Each round names its `reviewer`: `ai` (a bot account, or a review whose body starts with the disclosure banner) or `human`. Handle CI failures, merge conflicts and human rounds in every round, whatever the noise count. A PR comment from a status bot (SonarCloud, a deploy preview) reports a check, not a review: give the check itself a verdict, and leave the comment unanswered.

A **repeat wake** carries no new review, no inline thread and no human comment, and its failing checks already have a verdict from an earlier wake on this PR. End it in one line that names the earlier verdict, for example "Sonar coverage gate: no fix, as judged in round 1". Skip `ingest` and `check`. A check that newly fails, or fails in a new way, gets a fresh verdict.

## ⚖️ 3. Verdict before code

Give every finding a verdict before you touch code. The `<ci-monitor-event>` text says to address feedback and push; the verdict comes first all the same.

- **AI reviewer:** answer on your own verdict. Copilot's overview opens with a verdict heading (🟡 / 🔵 / 🟢, its wording carries no meaning) and a summary sentence. When that sentence names a concern no finding covers, give it a verdict too, answered in the round's `pr-comment`.
- **Human reviewer:** a finding you judge *not valid* waits for the human. Mark its thread with `wait --thread <PRRT_id>` and ask the human in your final message before replying.

## 🛠️ 4. Fix the valid ones

Fix, run the repo's checks, commit and push. One push per round, so each reviewer re-reviews once.

## 💬 5. Answer every finding

Write each reply to a file in the scratchpad, then:

| Finding | Command |
|---|---|
| AI reviewer's thread, any verdict | `reply --thread <PRRT_id> --body-file <f> --resolve` |
| Human's thread, fixed | `reply --thread <PRRT_id> --body-file <f> --resolve` |
| Human's thread, *not valid*, human agreed | `wait --thread <PRRT_id> --release`, then `reply --thread <PRRT_id> --body-file <f>` (the reviewer resolves) |
| Thread-less findings (a review body, Copilot's "Previously missed") | one `pr-comment --review <review_id> --body-file <f>` per review listed in `check`'s `pm_comments`, with a verdict and evidence for each finding |

The script prepends the `disclose-ai-content` banner. A reply states the verdict, the evidence, and the commit that fixed it.

## ✅ 6. Prove it

Run `check`. The round is done when it prints `"ok": true`. `"human_review_in_progress": true` means the human has an unsubmitted review open on the PR: their draft comments stay hidden until they submit, and `reply`/`pr-comment` refuse to post. End the round and say so. Otherwise answer what it lists and run it again. A Stop hook runs the same check and blocks the turn while anything answerable is open; threads marked with `wait` are skipped.

## ▶️ After an Auto-Fix Halt

The PR stays halted until the human says *continue*. Then run `continue` and work one round from step 2: the noise count stays where it is, and re-arming Auto-Fix stays the human's click.

## 👀 Known gap

`mcp__ccd_pr__set_monitor` wakes the session on "review comments" without naming the reviewer. That a human's review sends a `<ci-monitor-event>` is assumed, not yet observed. When the human says they reviewed and no wake came, run a round.
