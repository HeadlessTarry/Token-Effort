## Scenario
User is running the fresh repo bootstrap flow and reaches Step 4. All three .github/ISSUE_TEMPLATE/ files already exist with custom content.

## Expected Behavior
Step 4 detects existing templates, warns, asks "One or more issue template files already exist. Overwrite all? [yes/no]", receives "yes", and overwrites all three files with the standard templates.

## Pass Criteria
- [ ] Detected existing template files
- [ ] Warned that template files already exist
- [ ] Asked for overwrite confirmation
- [ ] Overwrote all three files after "yes"
- [ ] config.yml contains blank_issues_enabled: false
- [ ] Completion summary reports "Issue templates: created"
