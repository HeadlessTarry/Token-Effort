## Scenario

The user runs `/brainstorming-gh-issue 28`. Phase 2 fetches the issue from GitHub.

## Expected Behaviour

- The skill fetches the issue using `gh issue view 28 --json number,title,body,comments,labels` (or a superset of these fields).
- All five fields are present so the skill can: display the issue number, use the title as context, use the body as context, inspect comments for re-entry detection, and check labels for `pending-review`.

## Pass Criteria

- [ ] `gh issue view` is called with `--json` and includes at minimum: `number`, `title`, `body`, `comments`, `labels`.
- [ ] The skill does not make separate follow-up calls to get individual fields.
- [ ] The JSON response is used for both label checking (Phase 2) and context injection (Phase 3).
