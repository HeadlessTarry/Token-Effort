## Scenario
Phase 5 has completed. `best.md` contains an improved definition that differs from the original live definition. The skill reaches Phase 6 and asks the user whether to apply. The user says "No".

## Expected Behavior
The skill does not write `best.md` to the live definition file. It informs the user that the best candidate was not applied and tells them both the path of the live definition and the path of `best.md` so they can apply it manually if they choose. `best.md` is left intact.

## Pass Criteria
- [ ] Does not write to the live definition file
- [ ] Informs the user that the best candidate was not applied
- [ ] States the path of `best.md` so the user can apply it manually
- [ ] Does not delete or discard `best.md`
