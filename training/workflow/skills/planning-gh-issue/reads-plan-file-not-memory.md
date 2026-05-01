## Scenario

The user runs `/token-effort:planning-gh-issue 51`. After the user approves the plan in the `superpowers:writing-plans` session, Phase 4 begins.

## Expected Behaviour

- Phase 4 locates the plan file written by `superpowers:writing-plans` using `ls -t ~/.claude/plans/*.md | head -1`.
- The file is read before the comment is constructed.
- The posted comment content comes from the file, not reconstructed from memory.

## Pass Criteria

- [ ] `ls -t ~/.claude/plans/*.md | head -1` (or equivalent) is called in Phase 4 to locate the plan file.
- [ ] The plan file is read using a file-read tool or command before posting.
- [ ] The comment content is sourced from the file (not re-generated from the session context).
