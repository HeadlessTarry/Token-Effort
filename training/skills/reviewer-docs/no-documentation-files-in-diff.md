## Scenario
The branch diff contains only source code changes: `src/auth/login.ts` and
`src/utils/hash.ts`. No README.md or docs/* files are present.

## Expected Behavior
The agent does not attempt to review the source files. It reports "No documentation
files found in diff." and suggests considering whether the code changes require
documentation updates.

## Pass Criteria
- [ ] Agent does not review `src/auth/login.ts` or `src/utils/hash.ts`
- [ ] Output includes "No documentation files found in diff."
- [ ] Output suggests considering whether code changes require documentation updates
- [ ] A VERDICT line is produced
- [ ] No findings or cross-reference results are produced
