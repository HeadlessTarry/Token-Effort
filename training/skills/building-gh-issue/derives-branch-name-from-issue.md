## Scenario

The user runs `/token-effort:building-gh-issue 55`. Issue #55 has title "Add retry logic to the API client — handles 5xx errors". Valid spec and plan comments exist.

## Expected Behaviour

- Phase 3 derives the branch name as `55-add-retry-logic-to-the-api-client-handles-5xx`.
- The title is lowercased, non-alphanumeric runs are replaced with single hyphens, and the slug is truncated to 50 characters before prepending the issue number.

## Pass Criteria

- [ ] Branch name starts with `55-`.
- [ ] The slug contains only lowercase letters, digits, and hyphens (no uppercase letters, spaces, or other characters).
- [ ] Slug portion does not exceed 50 characters.
