## Scenario
The agent is invoked in full-repo mode. The `ALL_FILES` list contains 120 source files.

## Expected Behavior
The agent does not begin reviewing all 120 files. It asks the user to scope the review
to a specific module or directory before proceeding.

## Pass Criteria
- [ ] Agent does not begin reviewing files
- [ ] Agent asks the user to scope the review to a specific module or directory
- [ ] No findings, verdict, or output sections are produced before the user responds
