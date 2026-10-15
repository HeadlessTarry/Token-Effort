#!/usr/bin/env node
// PR review state, round and noise counting, thread replies, and the hooks that guard them.
// The shepherding-pr-reviews skill drives it.
// GitHub is reached through a port (ghPort below), so tests can pass an in-memory fake to main().
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const USAGE = `Usage: review-state.js <subcommand> [options]

Agent-facing (each takes --repo owner/name --pr N, except reply):
  ingest      Record unprocessed reviews as rounds, apply the noise and round limits, print the plan.
              --assume KEY=High|Medium|Low (repeatable) supplies severities the agent judged.
  reply       Reply in-thread with the disclosure banner. --thread PRRT_id --body-file F [--resolve]
  pr-comment  Post the PR comment answering a round's thread-less findings. --review ID --body-file F
  wait        Mark a thread as waiting on the human's decision. --thread PRRT_id [--release]
  bind        Attach the PR's state to a session. --session-id ID
  check       Report threads and PR comments still unanswered; exit 1 while any remain.
  continue    After an Auto-Fix Halt, allow exactly one more round.
  status      Print the PR's state file.

Hook-facing (read the hook payload JSON on stdin):
  hook-post-create  PostToolUse on Bash/PowerShell: bind a PR that gh pr create just opened.
  hook-stop         Stop: block while a PR bound to this session has unanswered threads.

State lives under $CLAUDE_CONFIG_DIR (default ~/.claude) in state/shepherding-pr-reviews/.
`

// The disclose-ai-content skill's banner. A test pins it to that skill's text.
const BANNER = '> ✨ AI-generated content. Mistakes do happen - please review carefully.'
const NOISE_LIMIT = 3
const ROUND_LIMIT = 10
const SEVERITIES = ['High', 'Medium', 'Low']
const COPILOT_LOGINS = new Set(['copilot-pull-request-reviewer', 'copilot-pull-request-reviewer[bot]', 'Copilot'])
const PR_URL_RE = /https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/
// gh pr create in command position: at the start or after a separator, optionally behind VAR=value prefixes.
const GH_PR_CREATE_RE = /(?:^|[;&|(\n]|\$\()\s*(?:\w+=\S*\s+)*gh(?:\.exe)?\s+pr\s+create\b/
const BADGE_RE = /alt="(High|Medium|Low) severity"/
const THREAD_LINK_RE = /\]\([^)\s]*#discussion_r(\d+)\)/
const ROUND_MARKER_RE = /shepherding-pr-reviews: review (\d+)/g

// ---------------------------------------------------------------- state

function stateRoot(env) {
  const config = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')
  return path.join(config, 'state', 'shepherding-pr-reviews')
}

function prUrl(repo, pr) {
  return `https://github.com/${repo}/pull/${pr}`
}

// One file per PR: prs/<owner>/<repo>/<pr>.json. GitHub names are case-insensitive, so the path is lowercased.
// Every clone, worktree and session working on that PR reads the same rounds and limits.
function statePath(env, repo, pr) {
  const [owner, name, ...rest] = repo.toLowerCase().split('/')
  if (rest.length || ![owner, name].every((part) => /^[\w.-]+$/.test(part) && !/^\.+$/.test(part))) {
    throw new UsageError(`--repo ${repo}: expected owner/name`)
  }
  return path.join(stateRoot(env), 'prs', owner, name, `${pr}.json`)
}

function sessionIndexPath(env, sessionId) {
  return path.join(stateRoot(env), 'sessions', `${sessionId.replace(/[^\w.-]/g, '_')}.json`)
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function newState(repo, pr) {
  return {
    repo,
    pr,
    url: prUrl(repo, pr),
    session_id: null,
    created_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    noise_count: 0,
    noise_limit: NOISE_LIMIT,
    round_limit: ROUND_LIMIT,
    halted: false,
    one_shot: false,
    closed: false,
    processed_reviews: [],
    skipped_reviews: [],
    errored_reviews: [],
    rounds: [],
    waiting_on_user: [],
    pm_comment_due: [],
  }
}

function loadState(env, repo, pr) {
  return { ...newState(repo, pr), ...readJson(statePath(env, repo, pr), {}) }
}

function saveState(env, state) {
  const file = statePath(env, state.repo, state.pr)
  writeJson(file, state)
  return file
}

function bindState(env, repo, pr, sessionId) {
  const state = loadState(env, repo, pr)
  state.session_id = sessionId
  const file = saveState(env, state)
  const index = sessionIndexPath(env, sessionId)
  const files = readJson(index, [])
  if (!files.includes(file)) writeJson(index, [...files, file])
  return file
}

// ---------------------------------------------------------------- who posted it

function startsWithBanner(body) {
  return (body || '').trimStart().startsWith(BANNER)
}

// The agent's own reply or PR comment: the banner, under the local gh user. Never a round, never answered.
// A comment that opens a thread is a finding, even with the banner: it belongs to an AI review.
function isOwnPost(comment, viewer) {
  const login = comment.author?.login ?? comment.user?.login
  return login === viewer && startsWithBanner(comment.body)
}

function isCopilot(review) {
  return COPILOT_LOGINS.has(review.user?.login)
}

function isAiReview(review) {
  return review.user?.type === 'Bot' || /\[bot\]$/.test(review.user?.login || '') || startsWithBanner(review.body)
}

function withBanner(body) {
  return startsWithBanner(body) ? body : `${BANNER}\n\n${body}`
}

// ---------------------------------------------------------------- threads

function submittedComments(thread) {
  // Comments in an unsubmitted (PENDING) review are the human's draft: they do not exist yet.
  return thread.comments.filter((comment) => comment.state !== 'PENDING')
}

function unansweredThreads(state, pull, viewer) {
  const waiting = new Set(state.waiting_on_user)
  const found = []
  for (const thread of pull.threads) {
    const comments = submittedComments(thread)
    if (!comments.length || thread.isResolved || waiting.has(thread.id)) continue
    if (comments.length > 1 && isOwnPost(comments[comments.length - 1], viewer)) continue
    found.push({ thread_id: thread.id, path: thread.path, line: thread.line, comment_id: comments[0].databaseId })
  }
  return found
}

function hasOpenWork(report) {
  return report.threads.length > 0 || report.pm_comments.length > 0
}

function postedRoundMarkers(github, repo, pr) {
  const found = new Set()
  for (const comment of github.issueComments(repo, pr)) {
    for (const match of (comment.body || '').matchAll(ROUND_MARKER_RE)) found.add(Number(match[1]))
  }
  return found
}

function outstanding(github, state) {
  const pull = github.pullRequest(state.repo, state.pr)
  const report = { pr_state: pull.state, threads: [], pm_comments: [], human_review_in_progress: false }
  if (pull.state !== 'OPEN') {
    state.closed = true
    return report
  }
  if (pull.pending) return { ...report, human_review_in_progress: true }
  const posted = state.pm_comment_due.length ? postedRoundMarkers(github, state.repo, state.pr) : new Set()
  report.pm_comments = state.pm_comment_due.filter((id) => !posted.has(id)).sort((a, b) => a - b)
  report.threads = unansweredThreads(state, pull, github.viewer())
  return report
}

// ---------------------------------------------------------------- findings

function stripBadges(text) {
  return text.replace(/<picture>[\s\S]*?<\/picture>/g, '').replace(/<img [^>]*>/g, '').trim()
}

function titleOf(body) {
  const text = stripBadges((body || '').trimStart().replace(BANNER, ''))
  return (text.split('\n').find((line) => line.trim()) || '').trim().slice(0, 120)
}

function badgeSeverity(text) {
  return BADGE_RE.exec(text || '')?.[1] ?? null
}

// Copilot's overview lists its findings: threaded ones tagged "· New", thread-less ones under "Previously missed".
function parseCopilotOverview(body) {
  const findings = []
  for (const line of body.split('\n')) {
    const link = THREAD_LINK_RE.exec(line)
    if (!(line.trimStart().startsWith('- ') && link && line.includes('· New'))) continue
    const title = /\[([^\]]+)\]\([^)\s]*#discussion_r/.exec(stripBadges(line))
    findings.push({
      key: `r${link[1]}`,
      kind: 'new',
      severity: badgeSeverity(line),
      title: title ? title[1] : '',
      thread_comment_id: Number(link[1]),
    })
  }
  const missed = /Previously missed \(\d+\)[\s\S]*?<\/summary>([\s\S]*)/.exec(body)
  for (const [, summary, detail] of missed ? missed[1].matchAll(/<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g) : []) {
    const title = stripBadges(summary)
    const location = /`([^`]+:\d+)`/.exec(detail)
    findings.push({
      key: `pm:${crypto.createHash('sha1').update(title, 'utf8').digest('hex').slice(0, 8)}`,
      kind: 'previously_missed',
      severity: badgeSeverity(summary),
      title,
      location: location ? location[1].replaceAll('​', '') : null,
      detail: detail.trim().slice(0, 600),
    })
  }
  const open = /(\d+) open findings?/.exec(body)
  const recognised = body.includes('ccr-overview') && !(open && Number(open[1]) > 0 && !findings.some((f) => f.kind === 'new'))
  return { findings, recognised }
}

// Any other reviewer: each inline comment is a finding, and so is a non-empty review body.
function parseReview(review, comments) {
  const findings = comments.map((comment) => ({
    key: `r${comment.id}`,
    kind: 'thread',
    severity: badgeSeverity(comment.body),
    title: titleOf(comment.body),
    thread_comment_id: comment.id,
    path: comment.path,
  }))
  if ((review.body || '').trim()) {
    findings.push({ key: `review:${review.id}`, kind: 'review_body', severity: badgeSeverity(review.body), title: titleOf(review.body) })
  }
  return { findings, recognised: true }
}

// first | human | signal | noise | carry_over | quiet. Only an AI round can be noise.
function classifyRound(findings, reviewer, isFirst, carriedOver) {
  if (isFirst) return 'first'
  if (reviewer === 'human') return 'human'
  if (findings.some((finding) => finding.severity === 'High' || finding.severity === 'Medium')) return 'signal'
  if (findings.length) return 'noise'
  return carriedOver ? 'carry_over' : 'quiet'
}

function parseAssumptions(values) {
  const assumed = {}
  for (const value of values) {
    const at = value.lastIndexOf('=')
    const severity = value.slice(at + 1)
    if (at < 1 || !SEVERITIES.includes(severity)) {
      throw new UsageError(`--assume ${value}: expected KEY=${SEVERITIES.join('|')}`)
    }
    assumed[value.slice(0, at)] = severity
  }
  return assumed
}

// ---------------------------------------------------------------- agent-facing commands

function isCopilotError(review) {
  const body = review.body || ''
  return isCopilot(review) && body.includes('encountered an error') && !body.includes('ccr-overview')
}

function buildRound(review, comments, viewer, assumed) {
  const answerable = comments.filter(
    (comment) =>
      comment.pull_request_review_id === review.id && !(comment.in_reply_to_id && isOwnPost(comment, viewer)),
  )
  if (!answerable.length && !(review.body || '').trim()) return null
  const reviewer = isAiReview(review) ? 'ai' : 'human'
  const { findings, recognised } = isCopilot(review)
    ? parseCopilotOverview(review.body || '')
    : parseReview(review, answerable)
  for (const finding of findings) {
    if (finding.severity === null && assumed[finding.key]) {
      finding.severity = assumed[finding.key]
      finding.severity_source = 'agent'
    }
  }
  return {
    review_id: review.id,
    reviewer,
    author: review.user?.login ?? null,
    commit: (review.commit_id || '').slice(0, 7),
    submitted_at: review.submitted_at,
    format_recognised: recognised,
    findings,
    unknown_severity: reviewer === 'ai' ? findings.filter((finding) => finding.severity === null).map((finding) => finding.key) : [],
  }
}

function ingest(ctx, args) {
  const { env, github } = ctx
  const state = loadState(env, args.repo, args.pr)
  const assumed = parseAssumptions(args.assume)
  const viewer = github.viewer()
  const seen = new Set([...state.processed_reviews, ...state.skipped_reviews, ...state.errored_reviews])
  const pending = github
    .reviews(args.repo, args.pr)
    .filter((review) => review.submitted_at && review.state !== 'PENDING' && !seen.has(review.id))
    .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
  const comments = pending.length ? github.reviewComments(args.repo, args.pr) : []
  const open = outstanding(github, state)
  const carriedOver = open.threads.length + open.pm_comments.length
  const plan = {
    action: 'nothing',
    instruction: null,
    rounds: [],
    noise_count: state.noise_count,
    noise_limit: state.noise_limit,
    round_count: state.processed_reviews.length,
    round_limit: state.round_limit,
  }

  const rounds = []
  for (const review of pending) {
    if (isCopilotError(review)) {
      state.errored_reviews.push(review.id)
      ;(plan.copilot_errors ??= []).push(review.id)
      continue
    }
    const round = buildRound(review, comments, viewer, assumed)
    if (round) rounds.push(round)
    else state.skipped_reviews.push(review.id)
  }

  const drifted = rounds.find((round) => !round.format_recognised)
  if (drifted) {
    plan.action = 'format_drift'
    plan.instruction =
      `Copilot's overview for review ${drifted.review_id} no longer parses. Nothing was recorded. Tell the human ` +
      'the review format changed; answer the threads by hand with reply/check until the parser is fixed.'
    plan.rounds = [drifted]
    ctx.print(plan)
    return 2
  }
  if (rounds.some((round) => round.unknown_severity.length)) {
    plan.action = 'judge_severity'
    plan.instruction =
      'Judge the severity of each finding in rounds[].unknown_severity yourself, then re-run ingest with ' +
      '--assume <key>=High|Medium|Low for each. Nothing was recorded.'
    plan.rounds = rounds
    ctx.print(plan)
    return 0
  }

  for (const round of rounds) {
    round.kind = classifyRound(round.findings, round.reviewer, !state.processed_reviews.length, carriedOver)
    if (round.kind === 'noise' && !state.one_shot) state.noise_count += 1
    if (round.findings.some((finding) => finding.kind === 'previously_missed' || finding.kind === 'review_body')) {
      state.pm_comment_due.push(round.review_id)
    }
    state.processed_reviews.push(round.review_id)
    const { findings, unknown_severity, ...summary } = round
    state.rounds.push({ ...summary, findings: findings.map(({ key, kind, severity, title }) => ({ key, kind, severity, title })) })
    plan.rounds.push(round)
  }

  plan.noise_count = state.noise_count
  plan.round_count = state.processed_reviews.length
  let limitHit = null
  if (plan.round_count >= state.round_limit) limitHit = `Round limit (${state.round_limit} rounds) reached`
  else if (state.noise_count >= state.noise_limit) limitHit = `Noise limit (${state.noise_limit} noise rounds) reached`
  if (limitHit && !state.one_shot) {
    state.halted = true
    plan.action = 'halt'
    plan.instruction =
      `${limitHit}. Leave these findings as they are. Call mcp__ccd_pr__set_monitor with auto_fix=false, ` +
      `address_comments=false, url=${state.url}; then hand back to the human in your final message, listing ` +
      'what is still open.'
  } else if (state.halted && !state.one_shot) {
    plan.action = 'halt'
    plan.instruction = "This PR is halted. Report to the human; act only if they say 'continue'."
  } else if (plan.rounds.some((round) => round.findings.length) || carriedOver) {
    plan.action = 'handle'
  } else if (plan.copilot_errors) {
    plan.action = 'copilot_error'
    plan.instruction = 'Copilot failed to review. Tell the human to re-request the Copilot review.'
  }
  saveState(env, state)
  ctx.print(plan)
  return 0
}

function refuseDuringHumanReview(pending) {
  if (pending) {
    throw new UsageError(
      'Refused: this account has an unsubmitted (pending) review on the PR, so GitHub would file this inside ' +
        "the human's draft. Wait until they submit or discard it, then retry.",
    )
  }
}

function reply(ctx, args) {
  const { github } = ctx
  refuseDuringHumanReview(github.threadPullRequest(args.thread).pending)
  github.replyToThread(args.thread, withBanner(fs.readFileSync(args['body-file'], 'utf8')))
  if (args.resolve) github.resolveThread(args.thread)
  ctx.print({ thread: args.thread, replied: true, resolved: Boolean(args.resolve) })
  return 0
}

function prComment(ctx, args) {
  const { github } = ctx
  refuseDuringHumanReview(github.pullRequest(args.repo, args.pr).pending)
  const body = withBanner(fs.readFileSync(args['body-file'], 'utf8'))
  github.commentOnPr(args.repo, args.pr, `${body}\n\n<!-- shepherding-pr-reviews: review ${args.review} -->`)
  ctx.print({ review: args.review, commented: true })
  return 0
}

function wait(ctx, args) {
  const state = loadState(ctx.env, args.repo, args.pr)
  const waiting = new Set(state.waiting_on_user)
  if (args.release) waiting.delete(args.thread)
  else waiting.add(args.thread)
  state.waiting_on_user = [...waiting].sort()
  saveState(ctx.env, state)
  ctx.print({ waiting_on_user: state.waiting_on_user })
  return 0
}

function bind(ctx, args) {
  const file = bindState(ctx.env, args.repo, args.pr, args['session-id'])
  ctx.print({ bound: file, session_id: args['session-id'] })
  return 0
}

function check(ctx, args) {
  const state = loadState(ctx.env, args.repo, args.pr)
  const report = outstanding(ctx.github, state)
  report.waiting_on_user = state.waiting_on_user
  const done = !hasOpenWork(report)
  if (done && state.one_shot) {
    state.one_shot = false
    state.halted = true
  }
  saveState(ctx.env, state)
  report.ok = done
  ctx.print(report)
  return done ? 0 : 1
}

function continueRound(ctx, args) {
  const state = loadState(ctx.env, args.repo, args.pr)
  state.halted = false
  state.one_shot = true
  saveState(ctx.env, state)
  ctx.print({
    one_shot: true,
    noise_count: state.noise_count,
    note: 'One round allowed. Auto-Fix stays off; only the human re-arms it.',
  })
  return 0
}

function status(ctx, args) {
  ctx.print(loadState(ctx.env, args.repo, args.pr))
  return 0
}

// ---------------------------------------------------------------- hook-facing commands

function stringsIn(value) {
  if (typeof value === 'string') return [value]
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsIn)
  return []
}

// Drop text that is data rather than commands: heredoc bodies, PowerShell here-strings and quoted strings.
function commandText(command) {
  const lines = command.split('\n')
  const kept = []
  let delimiter = null
  for (const line of lines) {
    if (delimiter !== null) {
      if (line.replace(/^\t+/, '').trim() === delimiter) delimiter = null
      continue
    }
    kept.push(line)
    const heredoc = /<<-?\s*(['"]?)([\w.-]+)\1/.exec(line.replace(/<<</g, ''))
    if (heredoc) delimiter = heredoc[2]
  }
  return kept
    .join('\n')
    .replace(/@'[\s\S]*?\n'@|@"[\s\S]*?\n"@/g, '')
    .replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, '""')
}

function ranGhPrCreate(command) {
  return GH_PR_CREATE_RE.test(commandText(command))
}

function hookPostCreate(ctx) {
  const payload = ctx.readPayload()
  if (!ranGhPrCreate(payload.tool_input?.command || '')) return 0
  const match = stringsIn(payload.tool_response).map((text) => PR_URL_RE.exec(text)).find(Boolean)
  if (!match || !payload.session_id) return 0
  const repo = `${match[1]}/${match[2]}`
  const pr = Number(match[3])
  bindState(ctx.env, repo, pr, payload.session_id)
  const url = prUrl(repo, pr)
  const context =
    `PR ${url} was created and bound to this session. Load the shepherding-pr-reviews skill now and arm the ` +
    `Auto-Fix Watch: call mcp__ccd_pr__set_monitor with auto_fix=true, address_comments=true, url=${url}. ` +
    'When that tool is unavailable (a CLI session), tell the human the Auto-Fix Watch is not armed and that ' +
    'review rounds run when they say reviews have landed.'
  ctx.emit({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } })
  return 0
}

function sessionStates(env, sessionId) {
  if (!sessionId) return []
  const found = []
  for (const file of readJson(sessionIndexPath(env, sessionId), [])) {
    const state = readJson(file, null)
    if (state?.session_id === sessionId && !state.closed && !state.halted) found.push(state)
  }
  return found
}

function hookStop(ctx) {
  const payload = ctx.readPayload()
  const problems = []
  for (const state of sessionStates(ctx.env, payload.session_id)) {
    let report
    try {
      report = outstanding(ctx.github, state)
    } catch (error) {
      // GitHub unreachable: let the stop through rather than trap the session.
      ctx.stderr.write(`shepherding-pr-reviews: stop check skipped for ${state.url}: ${error.message}\n`)
      continue
    }
    saveState(ctx.env, state)
    if (hasOpenWork(report)) {
      problems.push(
        `${state.url}: ${report.threads.length} unanswered thread(s) ` +
          `[${report.threads.map((thread) => thread.thread_id).join(', ')}], ` +
          `PR comment due for review(s) [${report.pm_comments.join(', ')}]`,
      )
    }
  }
  if (problems.length) {
    const reason =
      'Review threads still need an answer (shepherding-pr-reviews skill). Reply in-thread and resolve, or mark ' +
      "a human reviewer's thread with `wait` when it needs the human's decision:\n- " +
      problems.join('\n- ')
    ctx.emit({ decision: 'block', reason })
  }
  return 0
}

// ---------------------------------------------------------------- GitHub port (gh CLI)

const THREADS_QUERY = `query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){
  state
  pending:reviews(states:[PENDING],first:1){totalCount}
  reviewThreads(first:100){nodes{
    id isResolved path line
    comments(last:50){nodes{databaseId state author{login} body}}
  }}
}}}`
const THREAD_PR_QUERY = `query($t:ID!){node(id:$t){... on PullRequestReviewThread{pullRequest{
  pending:reviews(states:[PENDING],first:1){totalCount}
}}}}`

function gh(args, input) {
  return execFileSync('gh', args, { encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024, stdio: 'pipe' })
}

function graphql(query, variables) {
  const args = ['api', 'graphql', '-f', `query=${query}`]
  for (const [key, value] of Object.entries(variables)) {
    args.push(typeof value === 'number' ? '-F' : '-f', `${key}=${value}`)
  }
  return JSON.parse(gh(args)).data
}

function restList(endpoint) {
  return gh(['api', endpoint, '--paginate', '--jq', '.[]'])
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
}

function ghPort() {
  let viewer
  return {
    viewer: () => (viewer ??= gh(['api', 'user', '--jq', '.login']).trim()),
    reviews: (repo, pr) => restList(`repos/${repo}/pulls/${pr}/reviews`),
    reviewComments: (repo, pr) => restList(`repos/${repo}/pulls/${pr}/comments`),
    issueComments: (repo, pr) => restList(`repos/${repo}/issues/${pr}/comments`),
    pullRequest(repo, pr) {
      const [o, r] = repo.split('/')
      const pull = graphql(THREADS_QUERY, { o, r, n: pr }).repository.pullRequest
      return {
        state: pull.state,
        pending: pull.pending.totalCount,
        threads: pull.reviewThreads.nodes.map((thread) => ({ ...thread, comments: thread.comments.nodes })),
      }
    },
    threadPullRequest(threadId) {
      return { pending: graphql(THREAD_PR_QUERY, { t: threadId }).node.pullRequest.pending.totalCount }
    },
    replyToThread(threadId, body) {
      graphql(
        'mutation($t:ID!,$b:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t,body:$b}){comment{url}}}',
        { t: threadId, b: body },
      )
    },
    resolveThread(threadId) {
      graphql('mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}', { t: threadId })
    },
    commentOnPr(repo, pr, body) {
      gh(['pr', 'comment', String(pr), '--repo', repo, '--body-file', '-'], body)
    },
  }
}

// ---------------------------------------------------------------- entry point

class UsageError extends Error {}

const COMMANDS = {
  ingest: { run: ingest, pr: true, options: { assume: 'list' } },
  reply: { run: reply, options: { thread: 'required', 'body-file': 'required', resolve: 'flag' } },
  'pr-comment': { run: prComment, pr: true, options: { review: 'number', 'body-file': 'required' } },
  wait: { run: wait, pr: true, options: { thread: 'required', release: 'flag' } },
  bind: { run: bind, pr: true, options: { 'session-id': 'required' } },
  check: { run: check, pr: true },
  continue: { run: continueRound, pr: true },
  status: { run: status, pr: true },
  'hook-post-create': { run: hookPostCreate },
  'hook-stop': { run: hookStop },
}

function parseArgs(name, command, argv) {
  const options = { ...command.options, ...(command.pr && { repo: 'required', pr: 'number' }) }
  const args = Object.fromEntries(Object.entries(options).filter(([, kind]) => kind === 'list').map(([key]) => [key, []]))
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '')
    const kind = options[key]
    if (!argv[i].startsWith('--') || !kind) throw new UsageError(`${name}: unknown argument ${argv[i]}`)
    if (kind === 'flag') {
      args[key] = true
      continue
    }
    const value = argv[++i]
    if (value === undefined) throw new UsageError(`${name}: --${key} needs a value`)
    if (kind === 'list') args[key].push(value)
    else if (kind === 'number') {
      if (!/^\d+$/.test(value)) throw new UsageError(`${name}: --${key} must be a number`)
      args[key] = Number(value)
    } else args[key] = value
  }
  for (const [key, kind] of Object.entries(options)) {
    if ((kind === 'required' || kind === 'number') && args[key] === undefined) {
      throw new UsageError(`${name}: --${key} is required`)
    }
  }
  return args
}

function main(argv, io = {}) {
  const stdout = io.stdout || process.stdout
  const stderr = io.stderr || process.stderr
  const [name, ...rest] = argv
  if (!name || name === '--help' || name === '-h') {
    stdout.write(USAGE)
    return name ? 0 : 2
  }
  const command = COMMANDS[name]
  const ctx = {
    env: io.env || process.env,
    github: io.github || ghPort(),
    stderr,
    // print: indented JSON for the agent. emit: one-line JSON for Claude Code's hook runner.
    print: (value) => stdout.write(JSON.stringify(value, null, 2) + '\n'),
    emit: (value) => stdout.write(JSON.stringify(value) + '\n'),
    readPayload() {
      try {
        return JSON.parse(io.stdin ?? fs.readFileSync(0, 'utf8')) || {}
      } catch {
        return {}
      }
    },
  }
  try {
    if (!command) throw new UsageError(`unknown subcommand: ${name}\n\n${USAGE}`)
    return command.run(ctx, parseArgs(name, command, rest))
  } catch (error) {
    stderr.write(`review-state: ${error.message}\n`)
    return error instanceof UsageError ? 2 : 1
  }
}

module.exports = { BANNER, main }

if (require.main === module) process.exitCode = main(process.argv.slice(2))
