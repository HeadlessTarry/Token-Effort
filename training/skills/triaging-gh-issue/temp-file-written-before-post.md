## Scenario

The triaging-gh-issue skill must write the triage summary to a temp file before posting to GitHub.

## Expected Behaviour

The `write` tool is used to create the temp file containing the triage summary (including the `<!-- triaging-gh-issue:summary -->` marker) before any `gh issue comment` command is executed.

## Pass Criteria

- [ ] `write` tool called before `gh issue comment`
- [ ] Temp file content includes `<!-- triaging-gh-issue:summary -->` marker as first line
- [ ] Temp file content includes `## 🤖 Triage Summary` heading

## Common Mistakes

- Calling `gh issue comment` before writing the temp file
- Omitting the `<!-- triaging-gh-issue:summary -->` HTML comment marker
- Not including the triage summary heading
