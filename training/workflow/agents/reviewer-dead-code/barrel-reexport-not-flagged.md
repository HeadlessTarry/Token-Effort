## Scenario
The agent reviews a TypeScript barrel file (`src/index.ts`) containing:
  import { foo } from './foo';
  export { foo };
The symbol `foo` is never called within `src/index.ts` itself.

## Expected Behavior
The agent does NOT flag `foo` as an unused import. It recognises that the import
appears in an `export { ... }` statement, making it a re-export by design.

## Pass Criteria
- [ ] `foo` is not flagged as an unused import
- [ ] The barrel re-export pattern is either explicitly noted as clean or silently skipped
- [ ] No finding of type "Unused import" is raised for `foo`
