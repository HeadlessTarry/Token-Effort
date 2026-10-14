# 📖 Glossary

**Working conventions**:
How the maintainer tracks work, the same across all repos (issue tracker, triage labels). Installed once per user (by the core plugin on Claude Code).
_Avoid_: repo config, settings

**Core plugin**:
The Claude Code plugin that ships this repo's skills and working conventions. Required, unlike an overhaul mod, which is optional.
_Avoid_: base plugin, main plugin, token-effort plugin

**Skill frontmatter field**:
A frontmatter field in a `SKILL.md` that the Agent Skills spec defines: `name`, `description`, `license`, `compatibility`, `metadata` or `allowed-tools`. Skills in this repo use only Skill frontmatter fields, so they work on any Agent Skills platform.
_Avoid_: spec field, standard field, portable field

**Platform-specific frontmatter field**:
A frontmatter field in a `SKILL.md` that only some platforms read and the Agent Skills spec does not define (e.g. Claude Code's `user-invocable` and `disable-model-invocation`). Skills in this repo do not use them.
_Avoid_: custom field, extension field, non-standard field

**Repo conventions**:
Conventions specific to one repo (e.g. domain doc layout).

**Overhaul mod**:
One Claude Code plugin that reskins Claude Code around a single theme by bundling several features (e.g. an output style and mods). Installed all-or-nothing: you get the whole overhaul mod, or none.
_Avoid_: persona, total overhaul, theme pack, skin

**Mod**:
A feature that changes Claude Code's own interface or behaviour, such as a pane, status line or toast. Usually one of the features an overhaul mod ships. A mod may bolt on to a skill: the skill owns what the mod reads, and the mod stays out of sight when the skill is not in use.
_Avoid_: extension, add-on, widget
