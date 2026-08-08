---
name: disclose-ai-content
description: Always apply when creating or editing GitHub issues, pull requests, or comments. Prepends a visual banner to AI-generated or AI-edited content.
user-invocable: false
---

# ✨ Disclose AI-Generated Content

## Overview

Automatically prepends a visual banner to any GitHub content that was AI-generated or AI-edited. This ensures readers know before they start reading whether the content was created by a human or an agent.

**Not user-invocable.** This skill activates automatically whenever an agent creates or edits GitHub issues, pull requests, or comments.

## When to Use

**Apply the banner when:**
- You write the primary content of an issue body, PR body, or comment
- You substantially edit human-written content (restructuring, rewriting, adding significant new material)
- You make minimal edits (typos, formatting, grammar) — even small changes require the banner

**Do not apply the banner when:**
- The content is entirely human-written and you are only performing mechanical operations (e.g., applying labels, closing issues)
- You are quoting other content within your post (the banner applies to your commentary, not the quoted material)
- The user explicitly opts out in the same prompt (see Opt-out section)

## Prerequisites

None. This skill requires no external tools, CLI authentication, or MCP servers. It is purely instructional and applies to agent behavior when posting GitHub content.

## Process

### Step 1 — Check Scope

Before writing any GitHub content, determine if the banner applies:

- **Applies to:** Issue bodies, PR bodies, issue comments, PR review comments
- **Does not apply to:** Code blocks, commit messages, discussions, wikis, file contents

If the content is out of scope, skip the banner entirely.

### Step 2 — Check for Opt-out

Review the user's prompt for natural-language opt-out requests such as:
- "skip the banner"
- "don't add the AI disclaimer"
- "no AI disclosure needed"

If the user opts out, do not add the banner. Proceed to post the content without disclosure.

### Step 3 — Check for Existing Banner (Deduplication)

If editing existing content, check the **first 5 lines** for the exact banner text:
```
> ✨ AI-generated content. Mistakes do happen - please review carefully.
```

If found, skip adding the banner again. Proceed with the edit.

### Step 4 — Prepend Banner

If the banner applies, is not opted out, and is not already present, prepend it as the **first line** of the content:

```markdown
> ✨ AI-generated content. Mistakes do happen - please review carefully.
[Your content starts here]
```

Ensure the banner is clearly separated from the content that follows (typically with a blank line).

### Step 5 — Post Content

Post the content using the appropriate GitHub CLI command or API. The banner is now part of the content body.

## Banner Format

**Exact text:**
```
> ✨ AI-generated content. Mistakes do happen - please review carefully.
```

**Placement rules:**
- Must be the **first line** of the content, before any other text

**Example:**
```markdown
> ✨ AI-generated content. Mistakes do happen - please review carefully.

## Summary

This PR implements...
```

## Deduplication

Before adding the banner, check the **first 5 lines** of existing content. If the exact banner text is already present, do not add it again.

**Check for this exact string:**
```
> ✨ AI-generated content. Mistakes do happen - please review carefully.
```

If found, skip adding the banner. If not found, prepend it.

## Scope

**Applies to:**
- GitHub issue bodies
- Pull request bodies
- Issue comments
- Pull request review comments

**Does not apply to:**
- Code blocks within content (the banner applies to the surrounding prose, not to code)
- GitHub Discussions
- GitHub Wikis
- Commit messages
- File contents in the repository

## Opt-out

Users can skip the banner by including natural language in the prompt that generates the content.

**Recognize these variations:**
- "skip the banner"
- "don't add the AI disclaimer"
- "no AI disclosure needed"
- "omit the AI banner"
- "post without the disclosure"

When the user opts out, do not prepend the banner. This is a per-prompt decision; the next prompt will require the banner again unless it also opts out.

## Quoted Content

When your post includes quotes of other content (human-written or AI-generated), the banner applies only to **your generated commentary**, not to the quoted material.

**Correct:**
```markdown
> ✨ AI-generated content. Mistakes do happen - please review carefully.
Here's my analysis of the issue:

> @user wrote:
> The system crashes when...

Based on this, I recommend...
```

The banner discloses your analysis, not the quoted text from @user.

## Common Mistakes

- **Adding the banner to code blocks** — the banner applies to prose content, not to code examples within the content
- **Placing the banner after other content** — it must be the very first line
- **Duplicating the banner** — always check the first 5 lines before adding; if it's already there, skip
- **Applying to out-of-scope content** — do not add the banner to commit messages, discussions, wikis, or file contents
- **Forgetting to apply to minimal edits** — even typo fixes and formatting changes require the banner
- **Skipping the banner when editing human content** — if you substantially edit or rewrite human content, the banner is required
- **Misinterpreting opt-out** — opt-out must be explicit in the same prompt; default is always-on

## Eval

- [ ] Banner is the first line of all AI-generated issue bodies, PR bodies, and comments
- [ ] Banner text is exactly: `> ✨ AI-generated content. Mistakes do happen - please review carefully.`
- [ ] Banner is clearly separated from following content (typically with a blank line)
- [ ] Banner is not duplicated when editing content that already contains it
- [ ] Banner is applied even for minimal edits (typos, formatting)
- [ ] Banner is not applied to code blocks, commit messages, discussions, or wikis
- [ ] Opt-out is respected when the user explicitly requests it in the prompt
- [ ] Quoted content is not covered by the banner; only the agent's commentary is disclosed
