## Scenario
The repo has `.github/ISSUE_TEMPLATE/feature_request.md` in its templates directory. The user invokes `/propose-feature`.

## Expected Behavior
Claude reads the template, identifies it as a feature/enhancement template (filename contains "feature"), and uses its sections to frame the interview questions.

## Pass Criteria
- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null` to discover templates
- [ ] Read the feature template file content
- [ ] Used the template's section headings to structure the interview
- [ ] Did not fall back to built-in question set
