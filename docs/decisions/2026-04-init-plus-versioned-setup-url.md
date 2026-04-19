# 2026-04-init-plus-versioned-setup-url

> **Status:** Active
> **Issue:** [#78 — C:/Program Files/Git/init-plus Step 3 references docs/github-setup.md as local path instead of live URL](https://github.com/HeadlessTarry/Token-Effort/issues/78)
> **Date:** 2026-04-19

## 🗂️ Context

The `/init-plus` skill references `docs/github-setup.md` as a bare local path in Step 3. This file exists in the Token-Effort repository but not in the user's repository where `/init-plus` runs. Plugin users see a path that leads nowhere.

## ✅ Decision

Replace all bare `docs/github-setup.md` path references in `plugins/token-effort/skills/init-plus/SKILL.md` with Markdown links pointing to a versioned GitHub URL (e.g. `blob/v0.6.0/docs/github-setup.md`). The release workflow patches these URLs at publish time via a `sed` command, so they always reflect the installed plugin version rather than a floating `main` reference.

## ⚖️ Consequences

Plugin users always see documentation that matches their installed version. Between releases, `main` points to the previous tag's docs — acceptable since those are stable. If a future contributor adds a new reference in a different URL format, the `sed` will silently skip it; a verification step in the release workflow guards against this by asserting the expected URL count after substitution.
