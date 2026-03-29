## Scenario
The autoresearch loop is on cycle 3 out of a planned run. The candidate produced in cycle 3 scores 1.0 — a perfect score. No 5-cycle boundary has been reached and `cycles_without_improvement` is 0.

## Expected Behavior
The score = 1.0 condition triggers the human gate immediately after cycle 3, before running any further cycles. The skill pauses, shows the summary table for cycles 1–3, and asks the user whether to continue, stop, or adjust.

## Pass Criteria
- [ ] Pauses immediately when score reaches 1.0, even though fewer than 5 cycles have run
- [ ] Shows the summary table with one row per completed cycle
- [ ] Presents the three options: continue, stop, adjust
- [ ] Does not auto-continue to cycle 4
