## Scenario
A repository contains .github/dependabot.yaml (with a .yaml extension, not .yml).
The repo also has package.json.

## Expected Behavior
The skill detects the .yaml variant of the existing config file and warns the user that
.github/dependabot.yaml exists but the canonical filename is .github/dependabot.yml.
It suggests renaming the file to .github/dependabot.yml, and asks the user whether to
proceed (which would write the new file as .github/dependabot.yml).

## Pass Criteria
- [ ] Detected .github/dependabot.yaml (the .yaml variant)
- [ ] Warned the user that .github/dependabot.yaml exists and the canonical filename is .github/dependabot.yml
- [ ] Suggested the user delete or rename the `.yaml` file to avoid having two configs
- [ ] Did NOT silently overwrite or ignore the .yaml file
- [ ] Asked for user confirmation before proceeding
