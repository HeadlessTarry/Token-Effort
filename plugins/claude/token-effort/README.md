# 🪙 Token-Effort core plugin

Claude Code features shipped only by the `token-effort` core plugin. Installs that copy the skills by another route, such as `npx skills add`, do not get them. Install routes are in the [root README](../../../README.md).

| Feature | What it is |
|---------|------------|
| Session titles from issues | A `UserPromptSubmit` hook that titles a session after the GitHub issue its prompt references (below) |
| `shepherding-pr-reviews` skill | Walks an open PR through review rounds from human and AI reviewers (below) |
| Port MCP server | Port's EU MCP server, available in every session (below) |
| SonarQube Cloud MCP server | SonarQube Cloud's hosted, read-only MCP server, configured with your own user token (below) |

## 🏷️ Session titles from issues

When a prompt is a slash command that references an issue, such as `/triage #123` or `/implement #456`, the session is titled `[#123] <issue title, at most 8 words>`.

- The title is the issue's own title from `gh issue view`, cut to 8 words. It is not an agent-written summary, because in the CLI the model has no tool to rename a session.
- A session that already has a custom title keeps it, so a later prompt with another issue ref does not rename it.
- If `gh` is missing, unauthenticated or the issue does not exist, the hook prints nothing and the prompt goes ahead as normal.
- In the Claude desktop app, the app replaces the hook's title with its own generated one (for `/mattpocock-skills:triage #230` it was `Mattpocock skills triage #230`). So the hook also asks the agent, through `additionalContext`, to call the app's `mcp__ccd_session_mgmt__set_session_title` tool with the same title. The app renames a generated title without asking, and asks the user before replacing a title they set. In the CLI that tool does not exist and the agent ignores the request.

Script: [scripts/session-title.js](scripts/session-title.js), registered in the core plugin entry in [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json).

Limitations:

- The hook runs `node` on every prompt, and calls `gh` only for matching prompts in untitled sessions.
- Verified in the desktop app: the hook's title is written to the transcript, then overwritten by the app's generated title, which the app re-writes as the custom title on every later turn. `set_session_title` on a session with a generated title renames it without a prompt, and the new title persists in the transcript.
- Not verified end to end: a new desktop session started with `/<skill> #<n>` keeping the `[#<n>] ...` title after the agent's rename.
- In the desktop app the title change costs the agent one tool call in the first turn.

## 🐑 shepherding-pr-reviews

A skill ([ADR 0008](../../../docs/adr/0008-claude-only-pr-review-skill.md)) that walks an open PR through review rounds from human and AI reviewers: a verdict for each comment, fixes for the valid ones, in-thread replies, and an Auto-Fix Halt at the noise or round limit (terms in [GLOSSARY.md](../../../GLOSSARY.md)).

- A `PostToolUse` hook binds a PR to the session after `gh pr create`, and a `Stop` hook blocks a turn from ending while that PR has unanswered review threads.
- Arming the Auto-Fix Watch needs the Claude desktop app. In a CLI session, rounds run when you say reviews have landed.
- GitHub holds each PR's state, so any machine or session sees the same rounds and halt. The PR carries a `shepherd: active` label while shepherded, and `shepherd: halted` after an Auto-Fix Halt; remove `shepherd: halted` to allow one more round. Only the list of PRs each session's Stop hook guards stays local, under `~/.claude/state/shepherding-pr-reviews/sessions/`.

Skill: [skills/shepherding-pr-reviews/SKILL.md](skills/shepherding-pr-reviews/SKILL.md).

Limitations:

- Both hooks run `node` in every session. With no `gh pr create` and no bound PR, they exit without calling `gh`.
- Not verified: whether the Auto-Fix Watch wakes the session for a human's review.

## 🔌 MCP servers

The core plugin registers two MCP servers under `mcpServers` in its entry in [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json): Port and SonarQube Cloud.

### 🧭 Port MCP server

The core plugin registers [Port's MCP server](https://docs.port.io/agent-management/port-mcp-server/installation) as `port-eu` (`https://mcp.port.io/v1`, HTTP transport) in every session. It sends `x-read-only-mode: 0`, so Port's write tools and actions are available.

The server is declared under `mcpServers` in the core plugin entry in [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json).

First use:

1. Restart Claude Code after installing or updating the plugin.
2. Run `/mcp`, select the Port server, and finish the login in your browser.
3. Check it works by asking Claude to list your Port blueprints.

Limitations:

- EU region only. A US account (Port app URL contains `us`) needs its own `claude mcp add --transport http port-us https://mcp.us.port.io/v1 --header "x-read-only-mode: 0"`.
- If you previously added Port yourself with `claude mcp add`, remove that entry, or the server appears twice.
- Sessions without a Port login show the server as needing authentication in `/mcp`.

### 🔎 SonarQube Cloud MCP server

The core plugin registers [SonarQube Cloud's hosted MCP server](https://docs.sonarsource.com/sonarqube-mcp-server/setup/sonarqube-cloud-hosted) as `sonarqube` (`https://api.sonarcloud.io/mcp`, HTTP transport). It sends `SONARQUBE_READ_ONLY: true`, so only read tools are available.

The server and its two `userConfig` options (`sonarqube_token`, `sonarqube_org`) are declared in the core plugin entry in [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json). The token is stored in your credential store, not in the repo.

First use:

1. Create a user token under **My account > Access Tokens > Personal Tokens** in SonarQube Cloud.
2. Install or update the plugin and enter the token and your organization key when Claude Code asks. The organization key defaults to `headlesstarry`.
3. Restart Claude Code, run `/mcp` and check that `sonarqube` is connected.
4. Check it works by asking Claude for the quality gate status of a project.

Limitations:

- Only a user (personal) token works. Project, global and scoped organization tokens are rejected. SonarQube Cloud documents the Personal Tokens tab as available only to users who signed in with GitHub.
- EU region only. A US organization needs the URL `https://api.sonarqube.us/mcp`.
- The hosted server has a smaller tool set than the local Docker server. The architecture and dependency-risk tools need paid plans.
- A user who leaves the token empty gets a `sonarqube` server that fails to connect. The other servers are unaffected.
- Not verified against a live install: that the hosted server honours the `SONARQUBE_ORG` and `SONARQUBE_READ_ONLY` headers, and that `${user_config.*}` is substituted for an `mcpServers` entry declared in `marketplace.json`.
- Issue, rule and source text returned by the server is untrusted data.
