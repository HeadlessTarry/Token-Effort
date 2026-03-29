## Scenario
User runs `/run-training starting-git-branch`. No eval files exist. The skill auto-generates 4 starter eval cases derived from the definition content.

## Expected Behavior
Each of the 4 generated evals has the correct three-section format (`## Scenario`, `## Expected Behavior`, `## Pass Criteria`) with at least one unchecked checkbox. No frontmatter is included. The evals reflect actual behaviors described in the definition rather than being generic placeholders.

## Pass Criteria
- [ ] Each generated eval contains a `## Scenario` section
- [ ] Each generated eval contains a `## Expected Behavior` section
- [ ] Each generated eval contains a `## Pass Criteria` section with at least one `- [ ]` item
- [ ] No frontmatter (no `---` delimited header block) is included in any generated file
- [ ] Eval content is derived from the skill/agent definition, not generic boilerplate
