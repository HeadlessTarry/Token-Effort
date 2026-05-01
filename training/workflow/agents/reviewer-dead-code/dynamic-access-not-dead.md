## Scenario

The agent is reviewing a JavaScript module that defines a function `registerHandler`.
The function has zero direct call sites within the file. In a separate file included
in the diff, the function is referenced only via bracket notation:
`handlers['registerHandler']()`

## Expected Behavior

The agent does not flag `registerHandler` as dead code. It identifies the bracket-
notation access as a dynamic-use pattern, notes this in the output, and either
omits the finding entirely or rates it LOW severity.

## Pass Criteria
- [ ] `registerHandler` is NOT listed as a MEDIUM or HIGH unused-symbol finding
- [ ] The agent notes dynamic (bracket) access as a reason to skip or downgrade
- [ ] If a finding is raised at all, its severity is LOW
