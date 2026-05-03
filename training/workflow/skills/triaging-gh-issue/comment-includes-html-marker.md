## Scenario

One unlabelled open issue clearly describes a bug (a login crash). `GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`. Classification confidence is 92%.

## Expected Behaviour

- The label `bug` is applied via `gh issue edit`.
- A triage summary comment is posted whose body begins with the HTML marker
  `<!-- triaging-gh-issue:summary -->` on its own line.

## Pass Criteria

- [ ] `gh issue comment` is called for the issue.
- [ ] The comment body starts with `<!-- triaging-gh-issue:summary -->`.
- [ ] The comment includes `## 🤖 Triage Summary` as a heading.
- [ ] The comment includes a `**Label applied:**` line referencing `` `bug` ``.
- [ ] The comment includes a `**Confidence:**` line with a percentage.
- [ ] The comment includes a `**Reasoning:**` line.
- [ ] The comment includes a `**Duplicate check:**` line.
