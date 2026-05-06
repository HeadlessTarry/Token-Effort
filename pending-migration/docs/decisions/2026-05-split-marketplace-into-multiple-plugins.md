# 🗂️ 2026-05-split-marketplace-into-multiple-plugins

> **Status:** Active
> **Issue:** [#87 — Split marketplace into multiple plugins](https://github.com/HeadlessTarry/Token-Effort/issues/87)
> **Date:** 2026-05-02

## 📋 Context

The Token-Effort plugin marketplace offered a single `token-effort` plugin containing all skills, agents, and hooks — including experimental `labs` content (agent creator/engineer agents and hooks). Users who wanted only stable workflow skills had no way to avoid installing higher-risk experimental features. The single-plugin structure also made it harder to communicate which content is opt-in versus core.

## ✅ Decision

Split the single `token-effort` plugin into three focused plugins: `token-effort-initialise` (repository setup skills: init-plus, configuring-dependabot), `token-effort-workflow` (GitHub issue lifecycle skills and reviewer agents), and `token-effort-labs` (experimental and higher-risk features — opt-in only). All three plugins are versioned in lockstep. The split is a pure structural reorganization: file moves and namespace text updates, with no new logic introduced. A `base` plugin for any genuinely shared content is intentionally deferred until a concrete sharing need arises.

## ⚖️ Consequences

Users must update their install commands from one `claude plugin install token-effort` to three separate installs. Skills are now invoked under namespaced prefixes: `/token-effort-initialise:`, `/token-effort-workflow:`, and `/token-effort-labs:`. Existing CI/CD workflows referencing `plugins: token-effort` must be updated. The `labs` plugin being separate means users can explicitly opt in to experimental features without them being bundled with stable tooling. Deferring the `base` plugin means any future shared content will require a follow-up structural decision.
