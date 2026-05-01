## Scenario
The agent reviews a file containing a standard for-loop: `for (let i = 0; i < arr.length; i++)`.
No other naming issues are present in the file.

## Expected Behavior
The agent does NOT flag `i` as an unclear variable name. Single-letter variables in
conventional loop contexts (i, j, k) are not newcomer blockers — their meaning is
universally understood in that pattern.

## Pass Criteria
- [ ] `i` is not raised as a naming finding
- [ ] No finding of type naming/clarity is raised for the loop variable
- [ ] If the file is otherwise clean, VERDICT is PASS
