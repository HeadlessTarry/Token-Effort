// What the session and GitHub show Doomwheel about one PR.

export const REPO = 'clan-skryre/warp-engine'
export const PR = 42
export const PR_URL = `https://github.com/${REPO}/pull/${PR}`

/** What `gh pr create` prints. */
export const PR_CREATE_OUTPUT = `${PR_URL}\n`

export const CI_EVENT = `<ci-monitor-event>"Auto-fix pull requests" (the desktop app) is watching ${REPO} PR #${PR} and `
  + 'reports the following, read from the PR\'s state on GitHub.\n\n1 CI check failed (named below): run `gh pr checks 42`.\n\n'
  + '2 new review comments (quoted below): address the feedback and push a fix.'

export type PrShape = {
  state?: 'OPEN' | 'MERGED' | 'CLOSED'
  /** `author:STATE` for each review, oldest first. */
  reviews?: string[]
  unresolved?: number
  resolved?: number
  failing?: number
  passing?: number
  conflict?: boolean
}

/** What `gh api graphql` prints for the poll query, shaped as GitHub answers it. */
export function ghAnswer(shape: PrShape = {}): string {
  const { state = 'OPEN', reviews = [], unresolved = 0, resolved = 0, failing = 0, passing = 1, conflict = false } = shape
  const threads = [
    ...Array.from({ length: unresolved }, () => ({ isResolved: false })),
    ...Array.from({ length: resolved }, () => ({ isResolved: true })),
  ]
  const checks = [
    ...Array.from({ length: failing }, (_, i) => (i % 2 === 0
      ? { __typename: 'CheckRun', conclusion: 'FAILURE' }
      : { __typename: 'StatusContext', state: 'ERROR' })),
    ...Array.from({ length: passing }, () => ({ __typename: 'CheckRun', conclusion: 'SUCCESS' })),
  ]
  return JSON.stringify({
    data: {
      repository: {
        pullRequest: {
          state,
          mergeable: conflict ? 'CONFLICTING' : 'MERGEABLE',
          reviews: { nodes: reviews.map(one => {
            const [login, reviewState] = one.split(':')
            return { state: reviewState, author: { login } }
          }) },
          reviewThreads: { totalCount: threads.length, nodes: threads },
          commits: { nodes: [{ commit: { statusCheckRollup: { contexts: { nodes: checks } } } }] },
        },
      },
    },
  })
}
