## Scenario
A repository where the superpowers plugin is installed locally (e.g. a plugin config file
exists at .claude/plugins/). The user selects "2".

## Expected Behavior
The skill always shows [not verified] for Step 2 in the menu — it does not attempt to
detect the superpowers plugin from local files. The annotation is always [not verified].

## Pass Criteria
- [ ] Step 2 shows [not verified] in the menu regardless of any local plugin files
- [ ] The skill did NOT attempt to detect the superpowers plugin from the filesystem
- [ ] Printed the superpowers recommendation message
- [ ] Asked "Have you installed the superpowers plugin?"
