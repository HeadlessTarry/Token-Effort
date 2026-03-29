## Scenario
The autoresearch loop has run cycles 1, 2, and 3. None of the three cycles improved the score. After cycle 3, `state.json` shows `cycles_without_improvement: 3`. No 5-cycle boundary has been reached yet.

## Expected Behavior
After cycle 3 completes, the `cycles_without_improvement >= 3` condition triggers the human gate. The skill pauses, displays a summary table showing all 3 cycles, and asks the user whether to continue, stop, or adjust. It does not proceed automatically.

## Pass Criteria
- [ ] Pauses after the 3rd consecutive cycle without improvement (not after cycle 5)
- [ ] Shows a summary table with one row per cycle, including score, operator, and kept status
- [ ] Presents the three options: continue, stop, adjust
- [ ] Does not auto-continue — waits for explicit user response
