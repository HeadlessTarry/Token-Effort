## Scenario
Cycle 1 used the `add-constraint` operator and was not kept. The `failed_criteria` from cycle 1 show two criteria that both relate to ambiguous wording in the definition — specifically, the skill did not clearly distinguish between "evaluate the candidate" vs "evaluate best.md". `state.json` records `cycles_without_improvement: 1`.

## Expected Behavior
At the start of cycle 2, the skill analyzes the previous cycle's failure patterns from `results.jsonl`. Because the failures stem from ambiguous wording, it selects `tighten-language` as the operator. It does not blindly reuse `add-constraint` from cycle 1 since that produced no improvement.

## Pass Criteria
- [ ] Selects an operator that addresses the observed failure pattern (e.g., `tighten-language` for ambiguous wording failures)
- [ ] Does not reuse the same operator as the previous cycle when that cycle was not kept
- [ ] Explains the operator choice in relation to the failure pattern before applying the mutation
