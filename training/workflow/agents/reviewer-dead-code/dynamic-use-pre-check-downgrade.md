## Scenario
The agent is reviewing a Python file that contains `@Injectable` and `@Autowired`
annotations throughout. Several functions have zero text-search hits within the file.

## Expected Behavior
The agent runs the dynamic-use pre-check first, detects the DI annotations, notes this
in the output, and downgrades all unused-symbol findings in that file to LOW severity.
It does not flag any unused symbol as MEDIUM or HIGH for this file.

## Pass Criteria
- [ ] Dynamic-use pre-check runs before unused-symbol checks
- [ ] DI annotations (`@Injectable`, `@Autowired`) are detected and noted
- [ ] All unused-symbol findings in the file are rated LOW, not MEDIUM or HIGH
- [ ] The pre-check result is stated in the output before listing findings
