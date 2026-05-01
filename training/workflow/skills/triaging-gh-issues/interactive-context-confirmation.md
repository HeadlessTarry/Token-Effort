## Scenario

Two unlabelled open issues exist: #20 describes a feature request (would be classified as `enhancement`) and #21 describes a crash (would be classified as `bug`). The `GITHUB_ACTIONS` environment variable is NOT set, so the skill is running interactively.

The skill displays a summary table and waits for user input. The user responds "edit: change #20 to documentation". The skill updates the proposed label for #20 and re-displays the updated table. The user then responds "yes".

## Expected Behaviour

- Both issues are fetched and classified: #20 as `enhancement` and #21 as `bug`, each with action `apply`.
- A summary table is displayed to the user listing both issues and their proposed labels.
- The skill pauses and waits for the user to respond.
- The user responds "edit: change #20 to documentation".
- The skill updates the proposed label for #20 to `documentation` and re-displays the summary table with the updated label.
- The user responds "yes".
- `gh issue edit --add-label` is called for #20 with label `documentation` (the user's override, not `enhancement`).
- `gh issue edit --add-label` is called for #21 with label `bug`.
- `gh issue comment` is never called for either issue (both are `apply` actions on previously unlabelled issues).

## Pass Criteria

- [ ] A summary table is displayed before any write is attempted.
- [ ] The table is re-displayed after the user responds "edit: change #20 to documentation".
- [ ] `gh issue edit --add-label` is called for #20 with label `documentation` (not `enhancement`).
- [ ] `gh issue edit --add-label` is called for #21 with label `bug`.
- [ ] `gh issue comment` is never called for either issue.
- [ ] Final report shows 2 applied (new), 0 reclassified, 0 unchanged, 0 failures.
