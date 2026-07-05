## Scenario

The triaging-gh-issue skill must write the triage summary to a temp file before posting to GitHub.

## Expected Behaviour

A single bash command uses a heredoc to write the temp file containing the triage summary (including the `<!-- triaging-gh-issue:summary -->` marker), then posts it with `gh issue comment --body-file`, all in one command.

## Pass Criteria

- [ ] Heredoc write + `gh issue comment` in a single bash command
- [ ] Temp file content includes `<!-- triaging-gh-issue:summary -->` marker as first line
- [ ] Temp file content includes `## 🤖 Triage Summary` heading

## Common Mistakes

- Using the Write tool to create the temp file separately (triggers `external_directory` permission check)
- Calling `gh issue comment` before writing the temp file
- Omitting the `<!-- triaging-gh-issue:summary -->` HTML comment marker
