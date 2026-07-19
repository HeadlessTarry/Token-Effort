## Scenario
The user selects "3", confirms prerequisites, no existing workflow file. The skill writes
.github/workflows/triaging-gh-issue.yml.

## Expected Behavior
The written workflow file must match the template defined in the skill exactly, including
the correct action versions, trigger (issues.opened + workflow_dispatch with issue_number
input), and prompt text.

## Pass Criteria
- [ ] Workflow name is "Triage GitHub Issue"
- [ ] Trigger is `on: issues: types: [opened]` (not a cron schedule)
- [ ] `workflow_dispatch` has an `issue_number` input with `required: true` and `type: number`
- [ ] Uses `anomalyco/opencode/github` action
- [ ] Uses `secrets.GITHUB_TOKEN` for authentication
- [ ] Uses `secrets.OPENCODE_API_KEY` env var
- [ ] Model uses `vars.OPENCODE_MODEL` with fallback default
- [ ] `share: false` is set to prevent duplicate comments
- [ ] Prompt instructs to use the triaging-gh-issue skill
- [ ] Prompt passes the issue number: `${{ github.event.issue.number || inputs.issue_number }}`
