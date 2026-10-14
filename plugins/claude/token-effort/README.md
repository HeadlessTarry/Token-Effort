# 🪙 Token-Effort core plugin

Claude Code features shipped only by the `token-effort` core plugin. Installs that copy the skills by another route, such as `npx skills add`, do not get them. Install routes are in the [root README](../../../README.md).

| Feature | What it is |
|---------|------------|
| Session titles from issues | A `UserPromptSubmit` hook that titles a session after the GitHub issue its prompt references (below) |
| `shepherding-pr-reviews` skill | Walks an open PR through review rounds from human and AI reviewers (below) |

## 🏷️ Session titles from issues

When a prompt is a slash command that references an issue, such as `/triage #123` or `/implement #456`, the session is titled `[#123] <issue title, at most 8 words>`.

- The title is the issue's own title from `gh issue view`, cut to 8 words. It is not an agent-written summary, because in the CLI the model has no tool to rename a session.
- A session that already has a custom title keeps it, so a later prompt with another issue ref does not rename it.
- If `gh` is missing, unauthenticated or the issue does not exist, the hook prints nothing and the prompt goes ahead as normal.

Script: [scripts/session-title.js](scripts/session-title.js), registered in the core plugin entry in [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json).

Limitations:

- The hook runs `node` on every prompt, and calls `gh` only for matching prompts in untitled sessions.
- Not verified in the desktop app: whether the Code tab sidebar shows the hook's title, and whether the app's own generated title counts as a custom title, which would make the hook skip.

## 🐑 shepherding-pr-reviews

A skill ([ADR 0008](../../../docs/adr/0008-claude-only-pr-review-skill.md)) that walks an open PR through review rounds from human and AI reviewers: a verdict for each comment, fixes for the valid ones, in-thread replies, and an Auto-Fix Halt at the noise or round limit (terms in [GLOSSARY.md](../../../GLOSSARY.md)).

- A `PostToolUse` hook binds a PR to the session after `gh pr create`, and a `Stop` hook blocks a turn from ending while that PR has unanswered review threads.
- Arming the Auto-Fix Watch needs the Claude desktop app. In a CLI session, rounds run when you say reviews have landed.

Skill: [skills/shepherding-pr-reviews/SKILL.md](skills/shepherding-pr-reviews/SKILL.md). Its script's output contract: [OUTPUT-CONTRACT.md](skills/shepherding-pr-reviews/OUTPUT-CONTRACT.md).

Limitations:

- Both hooks run `node` in every session. With no `gh pr create` and no bound PR, they exit without calling `gh`.
- Not verified: whether the Auto-Fix Watch wakes the session for a human's review.
