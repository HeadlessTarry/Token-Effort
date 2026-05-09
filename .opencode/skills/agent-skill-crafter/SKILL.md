---
name: agent-skill-crafter
description: Creates high-quality OpenCode skills and agents through guided workflows, pattern analysis, and automatic handoff to run-training for iterative improvement.
user-invocable: true
---

# Agent-Skill-Crafter: Create Skills and Agents

## What I do

- Guide you through creating well-structured OpenCode skills (SKILL.md) and agents (agent.md)
- Fetch the latest official documentation from opencode.ai
- Analyze existing skills/agents in this repo for patterns and conventions
- Draft definitions that follow OpenCode standards and discovered patterns
- Present drafts for review and incorporate feedback
- Write the final file to the correct path
- Automatically hand off to `run-training` for iterative eval-based refinement

## When to use me

Use this when you want to:
- Create a new skill or agent from scratch
- Improve the quality and alignment of a new definition to OpenCode standards

**Not for iterative improvement** — use `run-training` for eval-based refinement of existing definitions.

## Workflow

### Phase 1: Fetch Docs

Load the latest OpenCode documentation:
- `https://opencode.ai/docs/skills/` — skill format, frontmatter, name validation, discovery
- `https://opencode.ai/docs/agents/` — agent format, modes, permissions, configuration
- Discover additional official docs from `opencode.ai` (config, rules, permissions, tools, commands)

Extract key constraints:
- Skill name regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Frontmatter: `name` (required), `description` (required, 1-1024 chars), `license` (optional), `compatibility` (optional), `metadata` (optional)
- Agent frontmatter: `name`, `description`, `mode`, `model`, `temperature`, `permission`, `prompt`, `steps`, `top_p`, `hidden`, `color`
- Path conventions: skills in `.opencode/skills/<name>/SKILL.md`, agents in `.opencode/agents/<name>.md`

### Phase 2: Analyze Patterns

Scan existing skills/agents in the repo across:
- `.opencode/skills/` and `.opencode/agents/`
- `skills/` and `agents/`

**Filter by type:** If creating a skill, scan only skills. If creating an agent, scan only agents.

Extract conventions:
- Section structure and naming
- Instruction style (imperative vs descriptive)
- Frontmatter patterns
- Common sections (What I do, When to use me, Workflow, etc.)
- Quality patterns from well-structured examples

### Phase 3: Interview User

Ask clarifying questions to understand what to create:
- What is the purpose/scope of the skill or agent?
- What should it do? (specific behaviors, workflows)
- When should it be used? (triggers, use cases)
- Any specific requirements? (permissions, model, temperature for agents)

If the user hasn't specified whether they want a skill or agent, ask.

### Phase 4: Draft

Produce a SKILL.md or agent.md following:
- Official OpenCode standards from fetched docs
- Discovered patterns from existing definitions
- User requirements from interview

**Validation checklist before presenting:**
- [ ] Skill/agent name matches `^[a-z0-9]+(-[a-z0-9]+)*$`
- [ ] Name is 1-64 characters, lowercase alphanumeric with single hyphens
- [ ] Name does not start/end with `-` or contain `--`
- [ ] Frontmatter has `name` and `description` (required)
- [ ] Description is 1-1024 characters and specific enough for the agent to choose correctly
- [ ] Correct path conventions per doc standards
- [ ] Agent has appropriate `mode`, `permission` fields
- [ ] Skill has `user-invocable` field if applicable
- [ ] Content follows clear, actionable instruction style

### Phase 5: Review Loop

Present the draft to the user. Incorporate feedback until approved. Iterate on:
- Structure and section organization
- Content clarity and completeness
- Instruction precision
- Alignment with user intent

### Phase 6: Write

Save to the correct path:
- **Skills:** `.opencode/skills/<name>/SKILL.md`
- **Agents:** `.opencode/agents/<name>.md`

Ensure directory exists before writing. Confirm the file was created successfully.

### Phase 7: Handoff to run-training

After writing the file, automatically invoke the `run-training` skill with the resolved path:
- For skills: `skills/<name>/SKILL.md`
- For agents: `agents/<name>.md`

Pass context to `run-training`:
- What was created (purpose, scope)
- Design decisions made during creation
- Any remaining uncertainties or areas that might benefit from eval-based refinement

Let `run-training` handle:
- Eval case generation from the new definition
- Baseline scoring
- Iterative improvement loop
- Results presentation for user approval

## Common Mistakes

- **Skipping doc fetch** — always load the latest docs from opencode.ai to ensure alignment with current standards
- **Not filtering by type** — when analyzing patterns, only scan skills if creating a skill, only agents if creating an agent
- **Writing without review** — always present the draft and get user approval before writing
- **Skipping validation** — run the full validation checklist before presenting the draft
- **Forgetting handoff** — always invoke `run-training` after writing the file
- **Modifying live file during training** — `run-training` handles this; your job ends at handoff
