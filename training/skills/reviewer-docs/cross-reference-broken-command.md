## Scenario
`README.md` documents an installation step: "Run `make install` to set up the project."
The repository's Makefile contains targets `build`, `test`, and `lint` — but no `install`.

## Expected Behavior
The agent verifies the `make install` command against the actual Makefile, finds no
`install` target, flags it as a HIGH finding, and produces a BLOCK verdict. The
Cross-Reference Results section shows `README.md command make install: ✗`.

## Pass Criteria
- [ ] Agent checks the Makefile for an `install` target
- [ ] Finding is raised with HIGH severity
- [ ] VERDICT is BLOCK
- [ ] Cross-Reference Results section shows `✗` for `make install`
- [ ] Finding includes a concrete suggestion (e.g. use an existing target or add the missing one)
