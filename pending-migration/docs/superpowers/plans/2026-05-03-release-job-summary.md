# Release Job Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `🎉 Summarise release` step to the `release` job that writes a formatted markdown block to `$GITHUB_STEP_SUMMARY`, surfacing the version and release URL directly on the workflow run summary page.

**Architecture:** Append a single `run:` step to `.github/workflows/release.yml` immediately after the `📦 Create GitHub release` step. The step echoes markdown lines to `$GITHUB_STEP_SUMMARY` using the `VERSION` env var already set on the job.

**Tech Stack:** GitHub Actions (`$GITHUB_STEP_SUMMARY`), Bash `echo`, YAML.

---

### Task 1: Add the Summarise Release step

**Files:**
- Modify: `.github/workflows/release.yml:80-85`

- [ ] **Step 1: Read the current end of the release job**

Open `.github/workflows/release.yml` and confirm the final step is `📦 Create GitHub release` (currently lines 80–85). This is where the new step is appended.

- [ ] **Step 2: Append the summary step**

Add the following block immediately after line 85 (the last line of `📦 Create GitHub release`):

```yaml
      - name: 🎉 Summarise release
        run: |
          echo "## 🎉 Release Published" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"
          echo "**Version:** v$VERSION" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"
          echo "**Link:** [View release on GitHub](https://github.com/${{ github.repository }}/releases/tag/v$VERSION)" >> "$GITHUB_STEP_SUMMARY"
```

The full `release` job steps section now ends with:

```yaml
      - name: 📦 Create GitHub release
        run: |
          gh release create "v$VERSION" \
            --generate-notes \
            --title "v$VERSION"

      - name: 🎉 Summarise release
        run: |
          echo "## 🎉 Release Published" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"
          echo "**Version:** v$VERSION" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"
          echo "**Link:** [View release on GitHub](https://github.com/${{ github.repository }}/releases/tag/v$VERSION)" >> "$GITHUB_STEP_SUMMARY"
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))" && echo "YAML OK"
```

Expected: `YAML OK`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: add job summary step to release workflow"
```
