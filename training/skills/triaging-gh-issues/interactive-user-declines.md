## Scenario

Two open issues exist: one is unlabelled and clearly a bug (app hangs on file upload), and one is labelled `enhancement` but clearly describes a crash (unambiguously a bug, so action is `reclassify`). The `GITHUB_ACTIONS` environment variable is NOT set. After the summary table is shown, the user responds "no".

## Expected Behaviour

- Both issues appear in the summary table (one `apply`, one `reclassify`).
- The user is prompted for confirmation and responds "no".
- The skill prints a cancellation message such as "No changes applied. Triage discarded."
- `gh issue edit` is never called for either issue.
- `gh issue comment` is never called.

## Pass Criteria

- [ ] Both issues are included in the summary table before the user is prompted.
- [ ] The skill prompts the user and waits for a response before writing anything.
- [ ] `gh issue edit` is never called after the user responds "no".
- [ ] `gh issue comment` is never called.
- [ ] A cancellation or "no changes" message is displayed to the user.
- [ ] Final report states "No changes applied. Triage discarded."
