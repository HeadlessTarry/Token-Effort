## Scenario
The autoresearch loop ran 4 cycles. Baseline score was 0.70; best score reached 0.90 in cycle 2. User says "stop" at the human gate. The content of `.training-results/best.md` differs from the original live definition. User is then asked about applying and says "yes".

## Expected Behavior
Phase 5 presents a completion summary and a diff. Phase 6 asks the user before writing. When the user approves, `best.md` is written to the live definition file.

## Pass Criteria
- [ ] Reports baseline score (0.70) and best score (0.90)
- [ ] Reports total cycles run (4) and counts of kept vs reverted mutations
- [ ] Shows a diff between `best.md` and the original live definition
- [ ] Asks the user for explicit approval before overwriting the live definition file
- [ ] Writes `best.md` to the live definition file after user approval
