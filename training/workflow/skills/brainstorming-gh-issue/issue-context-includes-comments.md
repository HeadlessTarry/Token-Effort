## Scenario

The user runs `/brainstorming-gh-issue 55`. Issue #55 has a title, a body describing a feature request, and three comments from team members providing additional context, constraints, and questions.

## Expected Behaviour

- The skill fetches the issue using `--json number,title,body,comments,labels` to capture all comments.
- The injected context for brainstorming includes not only the title and body but also all comments (with their authors).
- The brainstorming session has full visibility of the discussion that has taken place on the issue.

## Pass Criteria

- [ ] `gh issue view` is called with `--json` fields that include `comments`.
- [ ] The context injected for brainstorming includes the issue's comments, not just title and body.
- [ ] Each comment is attributed to its author in the context block.
