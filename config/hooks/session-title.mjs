// UserPromptSubmit hook: titles the session "[#<n>] <issue title, max 8 words>"
// when a slash-command prompt such as "/triage #123" references a GitHub issue.
// Fails open: any problem (no gh, no auth, no issue) emits nothing.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const MAX_WORDS = 8
const ISSUE_REF = /^\/\S+.*?#(\d+)\b/s

/** The issue number a prompt references, or null when it is not a slash command with "#<n>". */
export function issueRef(prompt) {
  const match = ISSUE_REF.exec(prompt.trim())
  return match ? match[1] : null
}

/** "[#<n>] <first MAX_WORDS words of the title>". */
export function formatTitle(number, issueTitle) {
  const words = issueTitle.trim().split(/\s+/).slice(0, MAX_WORDS)
  return `[#${number}] ${words.join(' ')}`
}

/** The hook's stdout object for a UserPromptSubmit input, or null to leave the title alone. */
export function hookOutput(input, lookupTitle) {
  if (input.session_title) return null
  const number = issueRef(input.prompt ?? '')
  if (!number) return null
  const issueTitle = lookupTitle(number, input.cwd)
  if (!issueTitle?.trim()) return null
  return {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      sessionTitle: formatTitle(number, issueTitle),
    },
  }
}

function ghIssueTitle(number, cwd) {
  return execFileSync('gh', ['issue', 'view', number, '--json', 'title', '--jq', '.title'], {
    cwd,
    encoding: 'utf-8',
    timeout: 8000,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function main() {
  try {
    const input = JSON.parse(readFileSync(0, 'utf-8'))
    const output = hookOutput(input, ghIssueTitle)
    if (output) process.stdout.write(JSON.stringify(output))
  } catch {
    // Fail open: never block the prompt over a title.
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
