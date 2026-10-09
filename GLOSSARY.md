# 📖 Glossary

**Working conventions**:
How the maintainer tracks work, the same across all repos (issue tracker, triage labels). Installed once per user by `install.sh`.
_Avoid_: repo config, settings

**Skill frontmatter field**:
A frontmatter field in a `SKILL.md` that the Agent Skills spec defines: `name`, `description`, `license`, `compatibility`, `metadata` or `allowed-tools`. Skills in this repo use only Skill frontmatter fields, so they work on any Agent Skills platform.
_Avoid_: spec field, standard field, portable field

**Platform-specific frontmatter field**:
A frontmatter field in a `SKILL.md` that only some platforms read and the Agent Skills spec does not define (e.g. Claude Code's `user-invocable` and `disable-model-invocation`). Skills in this repo do not use them.
_Avoid_: custom field, extension field, non-standard field

**Repo conventions**:
Conventions specific to one repo (e.g. domain doc layout).
