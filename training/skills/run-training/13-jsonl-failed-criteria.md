## Scenario
Cycle 2 produces a candidate that passes 6 out of 8 criteria. The two failing criteria are: "Reads `state.json` from disk at the start of each cycle" and "Does not write to the live definition file during the loop".

## Expected Behavior
After the cycle, the skill appends a JSONL entry to `results.jsonl`. The entry includes all required fields with correct types, and the `failed_criteria` array contains the exact text of the two failing criteria. In a separate cycle where all criteria pass, `failed_criteria` is an empty array.

## Pass Criteria
- [ ] `failed_criteria` contains the exact text of the 2 failing criteria
- [ ] `failed_criteria` is `[]` in cycles where no criteria fail
- [ ] All required fields are present: `iteration`, `score`, `best_score`, `operator`, `kept`, `failed_criteria`
- [ ] `score` and `best_score` are numbers, `kept` is a boolean, `failed_criteria` is an array
