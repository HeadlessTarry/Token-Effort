## Scenario
The user selects "3", confirms prerequisites, no existing workflow file. The skill writes
.github/workflows/triaging-gh-issue.yml.

## Expected Behavior
The written workflow file must match the template defined in the skill exactly, including
the correct action versions, trigger (issues.opened + workflow_dispatch with issue_number
input), allowedTools list, and prompt text.

## Pass Criteria
- [ ] Workflow name is "Triage GitHub Issue"
- [ ] Trigger is `on: issues: types: [opened]` (not a cron schedule)
- [ ] `workflow_dispatch` has an `issue_number` input with `required: true` and `type: number`
- [ ] Uses "anthropics/claude-code-action@fefa07e9c665b7320f08c3b525980457f22f58aa #v1"
- [ ] Uses actions/create-github-app-token@v3
- [ ] References vars.PROJECT_MANAGER_CLIENT_ID and secrets.PROJECT_MANAGER_PRIVATE_KEY
- [ ] References secrets.CLAUDE_CODE_OAUTH_TOKEN
- [ ] plugin_marketplaces includes HeadlessTarry/Token-Effort.git
- [ ] Prompt instructs to use token-effort-workflow:triaging-gh-issue
- [ ] Prompt passes the issue number: `#${{ github.event.issue.number || inputs.issue_number }}`
- [ ] allowedTools includes Skill and required Bash permissions
- [ ] allowedTools includes Bash(git branch --show-current)
- [ ] allowedTools does NOT include Bash(gh issue list *)
- [ ] claude_args includes --model sonnet
- [ ] Prompt block includes the GITHUB_STEP_SUMMARY write pattern
