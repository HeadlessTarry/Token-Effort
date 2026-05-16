## Scenario
The branch diff contains two changed files: `README.md` and `src/config.ts`.

## Expected Behavior
The agent reviews `README.md` only. It skips `src/config.ts` and notes in the output
that the file is outside documentation scope. It does not flag any issues with the
TypeScript file.

## Pass Criteria
- [ ] `src/config.ts` is not reviewed — no findings about it are raised
- [ ] Output notes that `src/config.ts` was skipped as outside documentation scope
- [ ] `README.md` is reviewed normally
- [ ] A recommendation to use a code reviewer for `src/config.ts` is included
