## Scenario
The agent reviews a file where a variable named `data` holds a parsed JWT payload.
The name is too generic and confuses a newcomer about what it contains.

## Expected Behavior
The agent raises this as a naming finding using curious, newcomer language ("As someone
new to this codebase, I wasn't sure what `data` contains...") rather than judgmental
language ("This was written carelessly" or "This is deliberately vague"). The finding
includes a concrete rename suggestion.

## Pass Criteria
- [ ] Finding is raised for the generic `data` variable name
- [ ] Language is written from a curious newcomer perspective, not as a judgment of the author
- [ ] No language implies bad intent or carelessness
- [ ] A concrete rename suggestion is included
