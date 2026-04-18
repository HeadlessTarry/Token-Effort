# 2026-04-plugin-documentation-index

> **Status:** Active
> **Issue:** [#48 — Documentation!](https://github.com/HeadlessTarry/Token-Effort/issues/48)
> **Date:** 2026-04-18

## Context

The token-effort plugin installs 12 skills, 5 agents, and several hooks, but users have no clear index or guidance on what each tool does, when to use it, or how the tools fit together in real workflows. The existing README provides installation steps but lacks context for users to understand the plugin's capabilities or navigate to the right tool for their task. Users cannot see the full development lifecycle and how skills orchestrate issue progression through project board statuses.

## Decision

Add a lightweight documentation index to the README that lists all skills and agents with one-line use cases, links directly to source definition files, and shows three concrete workflow diagrams demonstrating how users progress through real scenarios (Repository Initialization, Feature Development, Bug Fix). This keeps documentation maintainable by treating each skill/agent definition file as the single source of truth while giving users a clear entry point and workflow context.

Documentation updates include:
- Skills Index table linking to all 12 definition files
- Agents Index table linking to all 5 definition files
- Hooks section explaining purpose and automation
- Standalone Skills section for tools not in issue workflows
- Three Mermaid workflow diagrams showing progression through project board statuses
- GitHub Project board setup as documented prerequisite
- Updated Getting Started section with setup instructions
- Clarified skill naming conventions for new users
- Architecture documentation in Structure section explaining local vs. plugin skills

## Consequences

**Benefits:**
- New users have a clear entry point and can identify relevant tools by scanning tables
- Documentation remains maintainable because skill/agent descriptions live in definition files (single source of truth)
- Workflow diagrams make the issue lifecycle explicit, reducing user confusion about skill orchestration
- Project board status tracking is now documented and required in setup
- Local skills are distinguished from plugin skills, avoiding confusion about scope

**Trade-offs:**
- README becomes longer (additional ~80 lines), though well-organized in sections
- Mermaid diagrams require GitHub rendering; other markdown viewers may show raw syntax
- If skill definitions are updated in SKILL.md files, the README descriptions will not auto-sync and must be updated separately (relying on reviewer discipline)

**Future implications:**
- New skills added to the plugin should be documented in this index
- Workflow diagrams should be updated if skill progression changes or new workflows are discovered
- GitHub Project board status names should remain consistent with the documented labels
