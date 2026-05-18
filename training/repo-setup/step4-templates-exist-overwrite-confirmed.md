## Scenario
All three .github/ISSUE_TEMPLATE/ files already exist with custom content. The user selects
"4" and says "yes" when asked about overwriting.

## Expected Behavior
Step 4 detects existing templates, warns, receives "yes", and overwrites all three files
with the standard templates.

## Pass Criteria
- [ ] Detected existing template files
- [ ] Warned that template files already exist
- [ ] Overwrote all three files after "yes"
- [ ] config.yml contains blank_issues_enabled: false
- [ ] Completion summary reports templates as created/overwritten (not skipped)
