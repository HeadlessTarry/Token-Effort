## Scenario
No eval files exist. The skill generates 4 starter evals and displays them. The user says "tweak eval 2 — change the pass criterion to also check that the error names the exact missing path". The skill updates eval 2 in response. The user then approves all 4 evals.

## Expected Behavior
The generated evals are displayed to the user but not written to disk until after approval. When the user requests an edit before approving, the edit is incorporated. Only after explicit approval are all 4 files written to the training directory — using the edited version of eval 2, not the original.

## Pass Criteria
- [ ] Generated eval content is displayed to the user before any files are written to disk
- [ ] Files are not written to `training/<type>/<name>/` until the user explicitly approves
- [ ] User edits made before approval are incorporated into the written files
- [ ] The edited version of the eval (not the pre-edit original) is what gets written to disk
