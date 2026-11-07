# 📖 Glossary

**Working conventions**:
How the maintainer tracks work, the same across all repos (issue tracker, triage labels). Installed once per user, by `install.sh` or by installing the core plugin directly.
_Avoid_: repo config, settings

**Core plugin**:
The Claude Code plugin that ships this repo's skills and working conventions. Installed directly with `claude plugin install`, where it is required, or automatically by `install.sh`. An overhaul mod is optional on both routes.
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

**Round**:
One submitted PR review that carries something to answer (a comment or a body), and the work of answering it. Reviews from humans and AI reviewers count equally. An empty approval is not a round.
_Avoid_: pass, iteration, cycle

**Noise**:
A round from an AI reviewer whose findings are all Low severity. A round from a human is never noise.
_Avoid_: nitpicks, low-value round

**Verdict**:
The agent's judgement on one review comment, *valid* or *not valid*, backed by evidence (a code path, a reproduction, a test or a doc). Only *valid* comments get a fix. An AI reviewer's comment is answered on the agent's verdict alone. A human's comment judged *not valid* waits for the human to agree before the agent replies.
_Avoid_: ruling, assessment, triage result

**Auto-Fix Watch**:
The Claude desktop app's monitoring of one PR. It wakes the agent when CI fails, a merge conflict appears or a review lands, and lets the agent fix things without being asked. It is armed after the PR is created. A CLI session has none.
_Avoid_: watch (on its own), monitor, subscription, poller

**Auto-Fix Halt**:
A PR's state once the noise limit (3 noise rounds) or the round limit (10 rounds) is reached. The agent turns Auto-Fix off and addresses nothing more. The PR carries the `shepherd: halted` label and stays halted until the label is removed: by the agent when the human says *continue*, or by the human on GitHub. Removing it allows one more round: reviews submitted before then never trigger a halt, and the next review re-checks the limits. Re-arming Auto-Fix is always the human's click.
_Avoid_: halt (on its own), stop, pause, freeze
