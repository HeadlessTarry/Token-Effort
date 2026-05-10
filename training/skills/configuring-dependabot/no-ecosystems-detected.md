## Scenario
A repository contains no package files: no package.json, requirements.txt, pyproject.toml,
gemspec, Gemfile, go.mod, Cargo.toml, and no .github/workflows/ directory.

## Expected Behavior
The skill scans using Glob, finds no ecosystem indicators, outputs the "no ecosystems
detected" message, and stops without writing any file.

## Pass Criteria
- [ ] Scanned for all seven ecosystem indicator patterns
- [ ] Did NOT write .github/dependabot.yml
- [ ] Reported "No package ecosystems detected in this repository. Dependabot configuration not written."
