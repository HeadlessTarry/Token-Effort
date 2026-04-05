## Scenario

The user runs `/brainstorming-gh-issue 15` in re-entry mode. Issue #15 has five comments. The first four are regular discussion comments; the fifth begins with `<!-- brainstorming-gh-issue:spec -->` and contains the prior spec.

## Expected Behaviour

- The skill scans all comments in the fetched JSON response.
- It identifies the comment whose `body` starts with (or contains at the beginning) `<!-- brainstorming-gh-issue:spec -->`.
- It extracts that comment's full body as the prior spec.
- It does not confuse other comments for the spec.

## Pass Criteria

- [ ] The skill searches all comments, not just the first or last one.
- [ ] Only the comment starting with `<!-- brainstorming-gh-issue:spec -->` is treated as the prior spec.
- [ ] The other four discussion comments are not mistaken for the spec.
- [ ] The full body of the matching comment is used as the prior spec (not just a portion).
