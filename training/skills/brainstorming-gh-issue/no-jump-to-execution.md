## Scenario

The user runs `/brainstorming-gh-issue 119`. The issue title is "Migrate planning-gh-issue" and the body describes a migration task. The issue has no `pending-review` label and no prior spec comment.

## Expected Behaviour

- The skill fetches the issue and detects a fresh brainstorm.
- Phase 2c invokes `move-issue-status "Brainstorming"`.
- Phase 4 injects the issue context and invokes the `brainstorming` skill to run the full interactive loop.
- The skill does NOT treat the issue content as a work order. It does NOT start reading files, planning the migration, executing changes, or creating a todo list for implementation.
- The issue content is the brief for brainstorming — the brainstorming skill runs clarifying questions, approach proposals, and design sections before any implementation begins.
- Phase 5 (posting the spec, applying the label) only runs AFTER the user approves the design within the brainstorming session.

## Pass Criteria

- [ ] The `brainstorming` skill is invoked — the skill does not re-implement brainstorming inline.
- [ ] No implementation actions occur before brainstorming: no file reads for migration source, no todo list for implementation steps, no file writes, no git operations for the migration itself.
- [ ] The issue content is injected as the starting brief for brainstorming, not as instructions to execute.
- [ ] The skill explicitly instructs brainstorming not to re-ask questions already answered in the issue.
- [ ] `gh issue comment` and `gh issue edit` are NOT called until after the user approves the design in the brainstorming session.
