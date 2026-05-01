## Scenario

The user runs `/brainstorming-gh-issue 42`. Issue #42 exists with title "Add dark mode support", a description, and two comments. Its labels are `["enhancement"]` — `pending-review` is not present.

## Expected Behaviour

- The skill fetches issue #42 with `--json number,title,body,comments,labels`.
- It checks labels and finds no `pending-review` label.
- It proceeds as a **fresh brainstorm**: injects the issue title, body, and comments as context for `superpowers:brainstorming`.
- No "prior spec" is mentioned or loaded.

## Pass Criteria

- [ ] `gh issue view 42` is called with JSON fields including `labels`.
- [ ] The skill identifies that `pending-review` is not in the labels.
- [ ] Brainstorming is initiated as a fresh session — no mention of a prior spec.
- [ ] The issue title, body, and comments are provided as context to brainstorming.
