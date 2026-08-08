## Scenario
.github/ISSUE_TEMPLATE/01-feature_request.md already exists (but 02-bug_report.md and config.yml do not). User invokes `/repo-setup` and says "no" when asked about overwriting.

## Expected Behavior
Phase 1 detects the existing template file(s), presents a single consolidated warning and overwrite question covering all template files, receives "no", and skips writing all templates. This is noted in the summary. The skill continues to Phase 2.

## Pass Criteria
- [ ] Detected at least one existing template file
- [ ] Warned that template file(s) already exist before writing
- [ ] Asked a single overwrite question (not per-file)
- [ ] Did NOT write any template files after "no"
- [ ] Noted "Issue templates: skipped (overwrite declined)" in the completion summary
- [ ] Continued to Phase 2 (Dependabot) without halting
