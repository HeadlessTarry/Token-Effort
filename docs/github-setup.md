# ⚙️ GitHub Setup Guide

This guide covers the GitHub infrastructure required to use the Token-Effort skills and agents. The full workflow — triaging issues, brainstorming specs, building features, and cutting releases — depends on this foundation. It does **not** cover Claude Code configuration, plugin installation, or the release pipeline — only the GitHub-side setup.

**Audience:** Project maintainers, contributors, and external users who install the Token-Effort plugin and want to use its skills on their own GitHub repositories.

---

## ✅ Prerequisites Checklist

Use this checklist to see what you still need to set up. Each item links to the detailed section below.

- [ ] [GitHub organisation](#1-github-organisation) (or personal account — see [Personal Account Alternative](#personal-account-alternative))
- [ ] ["Project Manager" GitHub App](#2-project-manager-github-app) created and installed on the repository
- [ ] [GitHub Project board](#3-github-project-board) with Status field: `New` → `Brainstorming` → `Planning` → `Building` → `Done`
- [ ] [Project board linked to the repository](#3-github-project-board) (Settings → Linked repositories)
- [ ] [Issue labels](#4-issue-labels): `enhancement`, `bug`, `documentation`, `duplicate`, `pending-review`
- [ ] [Repository secret](#5-repository-secrets--variables): `PROJECT_MANAGER_PRIVATE_KEY`
- [ ] [Repository secret](#5-repository-secrets--variables): `CLAUDE_CODE_OAUTH_TOKEN`
- [ ] [Repository variable](#5-repository-secrets--variables): `PROJECT_MANAGER_CLIENT_ID`
- [ ] [Triage workflow](#6-triage-workflow) added to `.github/workflows/`

---

## 🏢 1. GitHub Organisation

A GitHub organisation is required because GitHub Apps cannot be granted access to Projects under a personal account — this is a platform limitation.

> **On a personal account?** Skip this section and see [Personal Account Alternative](#personal-account-alternative) instead.

**Steps:**

1. Follow [GitHub's documentation to create an organisation](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch).
2. Transfer or create your repository under the organisation.

---

## 🤖 2. Project Manager GitHub App

The Project Manager GitHub App is used by the triage workflow to authenticate with elevated permissions for both issue management and project board operations — permissions that the default `GITHUB_TOKEN` does not provide.

> **On a personal account?** Skip this section and see [Personal Account Alternative](#personal-account-alternative) instead.

**Steps:**

1. Go to your organisation's **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. Fill in the required fields:
   - **GitHub App name:** `Project Manager` (or any name you prefer)
   - **Homepage URL:** your repository URL (e.g. `https://github.com/your-org/your-repo`)
3. Under **Webhook**, uncheck **Active** — the webhook is not needed.
4. Set the following permissions:
   - **Repository permissions → Issues:** Read & Write
   - **Organization permissions → Projects:** Read & Write
5. Click **Create GitHub App**.
6. On the app's settings page, note the **Client ID** (labelled `Client ID`, formatted as `Iv1.xxxxxxxxxx`) — you will need it later. This is distinct from the numeric **App ID** shown just above it; the workflow requires the Client ID.
7. Scroll down to **Private keys** and click **Generate a private key**. A `.pem` file will download — keep it safe.
8. Go to the app's **Install App** tab and install it on your target repository.

---

## 📋 3. GitHub Project Board

The project board tracks issue status through the workflow lifecycle. The triage skill reads and writes the `Status` field to move issues between columns automatically.

**Steps:**

1. Navigate to your organisation's **Projects** tab → **New project**.
2. Choose **Board** or **Table** layout (either works).
3. Link the project to your repository:
   - Open the project → **Settings** → **Linked repositories** → add your repo.
4. Add a single-select field named exactly **`Status`** with options in this exact order:
   - `New`
   - `Brainstorming`
   - `Planning`
   - `Building`
   - `Done`

> **Important:** The field must be named exactly `Status` (case-sensitive). The `move-issue-status` skill searches for this field by name.

---

## 🏷️ 4. Issue Labels

These labels are used by the triage skill to classify issues by type. Run the following commands against your repository to create them:

```bash
# Check what labels already exist to avoid duplicates with GitHub defaults
gh label list

# Create the required labels
gh label create "enhancement"    --color "#a2eeef" --description "New feature or request"
gh label create "bug"            --color "#d73a4a" --description "Something isn't working"
gh label create "documentation"  --color "#0075ca" --description "Improvements or additions to documentation"
gh label create "duplicate"      --color "#cfd3d7" --description "This issue or pull request already exists"
gh label create "pending-review" --color "#FEF2C0" --description "Spec posted, awaiting human approval"
```

Alternatively, you can create labels via **Settings** → **Labels** in the GitHub UI.

> **Note:** GitHub creates several default labels (e.g. `bug`, `documentation`, `duplicate`, `enhancement`) when a repository is initialised. Run `gh label list` first and skip `gh label create` for any that already exist.

---

## 🔐 5. Repository Secrets & Variables

The triage workflow uses one repository variable and two secrets. Add them under **Settings** → **Secrets and variables** → **Actions**.

### Variables (Variables tab)

| Variable | Value |
|----------|-------|
| `PROJECT_MANAGER_CLIENT_ID` | The **Client ID** from the GitHub App General settings page (step 2.6 above — the `Iv1.` prefixed string, not the numeric App ID) |

### Secrets (Secrets tab)

| Secret | Value |
|--------|-------|
| `PROJECT_MANAGER_PRIVATE_KEY` | Full contents of the `.pem` file downloaded in step 2.7 above |
| `CLAUDE_CODE_OAUTH_TOKEN` | Your Claude Code OAuth token — generated during Claude Code setup. Run `claude auth status` to surface the token, or see the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for your version. |

> **On a personal account?** Replace the `PROJECT_MANAGER_CLIENT_ID` variable and `PROJECT_MANAGER_PRIVATE_KEY` secret with a single `GITHUB_PAT` secret — see [Personal Account Alternative](#personal-account-alternative).

---

## ⚙️ 6. Triage Workflow

The triage workflow runs automatically every Monday at 4am UTC and can also be triggered manually. It authenticates as the Project Manager GitHub App, then invokes the `token-effort-workflow:triaging-gh-issues` skill, which labels issues by type, detects duplicates, and advances issue statuses on the project board.

> **On a personal account?** See [Personal Account Alternative](#personal-account-alternative) for the workflow changes needed.

**Steps:**

1. Download the workflow file into your repository:

   ```bash
   mkdir -p .github/workflows && curl -sSL https://raw.githubusercontent.com/HeadlessTarry/Token-Effort/main/.github/workflows/triaging-gh-issues.yml -o .github/workflows/triaging-gh-issues.yml
   ```

   Alternatively, view the [latest version on main](https://github.com/HeadlessTarry/Token-Effort/blob/main/.github/workflows/triaging-gh-issues.yml) and copy its contents manually into `.github/workflows/triaging-gh-issues.yml` in your repository.

2. Leave the `plugin_marketplaces` and `plugins` inputs as-is — they point to the Token-Effort plugin and should not be changed.

---

## 👤 Personal Account Alternative

GitHub Apps require organisation-level permissions to access GitHub Projects. Personal accounts do not support this permission scope. If you are working under a personal account, use a Personal Access Token (PAT) instead.

**Why the limitation exists:** GitHub App permissions for Projects are only available at the organisation level. Personal accounts have no equivalent permission scope.

**Alternative setup:**

1. Create a classic Personal Access Token with the `repo` and `project` scopes:
   - Go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
   - Select scopes: `repo` (full control) and `project` (full control of projects).
2. Store the PAT as a repository secret named `GITHUB_PAT` (under **Settings** → **Secrets and variables** → **Actions** → **Secrets**).
3. Update the triage workflow — remove the `🔑 Authenticate as Project Manager` step (the `actions/create-github-app-token` block) and change the `github_token` input:

   Remove this block entirely:

   ```yaml
         - name: 🔑 Authenticate as Project Manager
           id: project-manager-token
           uses: actions/create-github-app-token@v3
           with:
             client-id: ${{ vars.PROJECT_MANAGER_CLIENT_ID }}
             private-key: ${{ secrets.PROJECT_MANAGER_PRIVATE_KEY }}
             owner: ${{ github.repository_owner }}
   ```

   Then change the `github_token` input in the `Run skill` step:

   ```yaml
   # Change from:
   github_token: ${{ steps.project-manager-token.outputs.token }}

   # To:
   github_token: ${{ secrets.GITHUB_PAT }}
   ```

> **Security note:** Classic PATs are broadly scoped compared to GitHub Apps. Rotate them regularly and use the minimum required scopes.

---

## ✔️ Verification

After completing all steps above, run the following to confirm everything is in place:

```bash
# Confirm all 5 required labels exist
gh label list

# Confirm the project board is visible
gh project list --owner <your-org>

# Trigger the triage workflow manually (run from inside a cloned copy of your repo,
# or pass --repo explicitly)
gh workflow run triaging-gh-issues.yml --repo <your-org>/<your-repo>
```

After triggering the workflow, open the **Actions** tab in your repository and select the **Triage GitHub Issues** run. Claude will post a markdown summary to the step summary once it completes — a successful run will show a brief activity report under the `✨ Run skill` step.

---

## 🚫 Out of Scope

This guide does not cover:

- Installing the Token-Effort plugin in Claude Code
- Configuring Claude Code itself (model settings, permissions)
- Setting up the Release Manager GitHub App
- Creating issue templates — not required for triage to run, but recommended. This repository's templates at [`.github/ISSUE_TEMPLATE/`](https://github.com/HeadlessTarry/Token-Effort/tree/main/.github/ISSUE_TEMPLATE) can be used as a starting point.
