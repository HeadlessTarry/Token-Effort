// Output of the shepherding-pr-reviews skill's script, shaped as its OUTPUT-CONTRACT.md promises.
// Doomwheel reads these fields and nothing else of the skill: rename one here and a test fails,
// which is the cue to check the skill's contract before changing Doomwheel.

export const REPO = 'clan-skryre/warp-engine'
export const PR = 42
export const PR_URL = `https://github.com/${REPO}/pull/${PR}`

/** How the skill tells the agent to run its script; the plugin root is left for the shell to expand. */
export const SCRIPT = 'node "${CLAUDE_PLUGIN_ROOT}/plugins/claude/token-effort/skills/shepherding-pr-reviews/scripts/review-state.js"'

export function scriptCommand(subcommand: string, extra = ''): string {
  return `${SCRIPT} ${subcommand} --repo ${REPO} --pr ${PR}${extra ? ` ${extra}` : ''}`
}

export const INGEST_HANDLE = {
  action: 'handle',
  instruction: null,
  noise_count: 1,
  noise_limit: 3,
  round_count: 3,
  round_limit: 10,
  rounds: [
    { review_id: 101, reviewer: 'ai', kind: 'signal', findings: [{ key: 'thread:1', severity: 'High' }, { key: 'thread:2', severity: 'Low' }] },
  ],
}

export const INGEST_NOISE_HALT = {
  action: 'halt',
  instruction: 'Noise limit (3 noise rounds) reached. Leave these findings as they are. Call mcp__ccd_pr__set_monitor with '
    + `auto_fix=false, address_comments=false, url=${PR_URL}; then hand back to the human in your final message, listing what is still open.`,
  noise_count: 3,
  noise_limit: 3,
  round_count: 4,
  round_limit: 10,
  rounds: [{ review_id: 104, reviewer: 'ai', kind: 'noise', findings: [{ key: 'thread:7', severity: 'Low' }] }],
}

export const INGEST_ROUND_HALT = {
  action: 'halt',
  instruction: 'Round limit (10 rounds) reached. Leave these findings as they are. Call mcp__ccd_pr__set_monitor with '
    + `auto_fix=false, address_comments=false, url=${PR_URL}; then hand back to the human in your final message, listing what is still open.`,
  noise_count: 1,
  noise_limit: 3,
  round_count: 10,
  round_limit: 10,
  rounds: [{ review_id: 110, reviewer: 'ai', kind: 'signal', findings: [{ key: 'thread:9', severity: 'High' }] }],
}

export const CHECK_OPEN = {
  ok: false,
  pr_state: 'OPEN',
  threads: [{ id: 'PRRT_a' }, { id: 'PRRT_b' }],
  pm_comments: [{ review: 101 }],
  waiting_on_user: ['PRRT_b'],
  human_review_in_progress: false,
}

export const CHECK_HUMAN_REVIEWING = { ...CHECK_OPEN, human_review_in_progress: true }

export const CHECK_MERGED = { ...CHECK_OPEN, ok: true, pr_state: 'MERGED', threads: [], pm_comments: [], waiting_on_user: [] }

/** What `gh pr create` prints. */
export const PR_CREATE_OUTPUT = `${PR_URL}\n`

export const CI_EVENT = `<ci-monitor-event>"Auto-fix pull requests" (the desktop app) is watching ${REPO} PR #${PR} and `
  + 'reports the following, read from the PR\'s state on GitHub.\n\n1 CI check failed (named below): run `gh pr checks 42`.\n\n'
  + '2 new review comments (quoted below): address the feedback and push a fix.'
