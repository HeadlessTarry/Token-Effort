## Scenario
There are 3 eval files: eval A has 2 criteria (both pass), eval B has 3 criteria (2 pass, 1 fails), eval C has 5 criteria (4 pass, 1 fails). Total: 8 criteria passed out of 10.

## Expected Behavior
The skill computes the score as total criteria passed divided by total criteria across all evals: 8/10 = 0.80. It does not average the per-eval scores (which would give (1.0 + 0.67 + 0.80) / 3 = 0.82). Evals with more criteria have proportionally more influence on the score.

## Pass Criteria
- [ ] Score is computed as total passed criteria / total criteria (8/10 = 0.80, not 0.82)
- [ ] An eval file with more criteria contributes proportionally more to the score than one with fewer
- [ ] Score is reported as a decimal value (e.g., 0.80), not as a percentage (80%)
