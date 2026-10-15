#!/usr/bin/env node
// PR review rounds, noise counting, thread replies, and the hooks that guard them.
// The shepherding-pr-reviews skill drives it.
// Every per-PR fact is derived from GitHub on each run: reviews, threads, the script's own bannered replies
// and markers, and the shepherd labels. Only the session index (which PRs a session guards) is local.
// GitHub is reached through a port (ghPort below), so tests can pass an in-memory fake to main().
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const USAGE = `Usage: review-state.js <subcommand> [options]

Agent-facing (each takes --repo owner/name --pr N, except reply):
  ingest      Derive the rounds, apply the noise and round limits, print the plan of unhandled rounds.
              --assume KEY=High|Medium|Low (repeatable) supplies severities the agent judged.
  reply       Reply in-thread with the disclosure banner. --thread PRRT_id --body-file F [--resolve]
              [--severity High|Medium|Low] records the agent's severity of the thread's finding.
              [--waiting] posts a holding reply: the thread waits on the reviewer (--body-file optional).
  pr-comment  Post the PR comment answering a round's thread-less findings. --review ID --body-file F
              [--severity KEY=High|Medium|Low] (repeatable) records the agent's severity per finding.
  bind        Guard the PR from a session's Stop hook. --session-id ID
  check       Report threads and PR comments still unanswered; exit 1 while any remain.
  continue    After an Auto-Fix Halt, remove the "shepherd: halted" label: allows exactly one more round.
  status      Print the PR's derived state.

Hook-facing (read the hook payload JSON on stdin):
  hook-post-create  PostToolUse on Bash/PowerShell: bind a PR that gh pr create just opened.
  hook-stop         Stop: block while a PR bound to this session has unanswered threads.

The session index lives under $CLAUDE_CONFIG_DIR (default ~/.claude) in state/shepherding-pr-reviews/sessions/.
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
const SEVERITY_MARKER_RE = /<!-- shepherding-pr-reviews: severity ([^>]*?) -->/g
const WAITING_MARKER = '<!-- shepherding-pr-reviews: waiting -->'
const WAITING_TEXT = "Not fixing this yet; waiting on the reviewer's decision."
// Display only, except that the Stop hook skips a PR carrying HALTED. Removing HALTED is the continue signal.
const ACTIVE = 'shepherd: active'
const HALTED = 'shepherd: halted'
const LABELS = {
  [ACTIVE]: { color: '0E8A16', description: 'shepherding-pr-reviews is working this PR' },
  [HALTED]: { color: 'B60205', description: 'shepherding-pr-reviews hit an Auto-Fix Halt; remove to continue' },
}
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------- session index (the only local state)

function stateRoot(env) {
  const config = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')
  return path.join(config, 'state', 'shepherding-pr-reviews')
}

function prUrl(repo, pr) {
  return `https://github.com/${repo}/pull/${pr}`
}

function checkRepo(repo) {
  const [owner, name, ...rest] = repo.split('/')
  if (rest.length || ![owner, name].every((part) => /^[\w.-]+$/.test(part || '') && !/^\.+$/.test(part))) {
    throw new UsageError(`--repo ${repo}: expected owner/name`)
  }
}

function sessionsDir(env) {
  return path.join(stateRoot(env), 'sessions')
}

function sessionIndexPath(env, sessionId) {
  return path.join(sessionsDir(env), `${sessionId.replace(/[^\w.-]/g, '_')}.json`)
}

// A session's index: the {repo, pr} pairs its Stop hook guards. Entries of the old format (file paths) are dropped.
function readSessionIndex(file) {
  try {
    const entries = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry.repo === 'string' && Number.isInteger(entry.pr)) : []
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return []
    throw error
  }
}

function writeSessionIndex(file, entries) {
  if (!entries.length) {
    fs.rmSync(file, { force: true })
    return
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(entries, null, 2) + '\n', 'utf8')
}

function samePr(entry, repo, pr) {
  return entry.repo.toLowerCase() === repo.toLowerCase() && entry.pr === pr
}

// Session files nobody touched for 30 days belong to sessions that ended with an open PR still listed.
function sweepSessions(env, keep) {
  const dir = sessionsDir(env)
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    if (file !== keep && Date.now() - fs.statSync(file).mtimeMs > SESSION_MAX_AGE_MS) fs.rmSync(file, { force: true })
  }
}

function bindSession(env, repo, pr, sessionId) {
  checkRepo(repo)
  const file = sessionIndexPath(env, sessionId)
  const entries = readSessionIndex(file)
  if (!entries.some((entry) => samePr(entry, repo, pr))) entries.push({ repo, pr })
  writeSessionIndex(file, entries)
  sweepSessions(env, file)
  return file
}

// Before GitHub held the state, each PR had a file under prs/. Nothing reads them now.
function deleteLegacyState(env) {
  fs.rmSync(path.join(stateRoot(env), 'prs'), { recursive: true, force: true })
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

// Answered: resolved, or the last comment is the agent's own reply (a final answer or a holding reply).
// A thread the agent opened itself (one comment) is a finding, not an answer.
function threadAnswered(thread, viewer) {
  const comments = submittedComments(thread)
  if (!comments.length || thread.isResolved) return true
  return comments.length > 1 && isOwnPost(comments[comments.length - 1], viewer)
}

function isWaiting(thread, viewer) {
  const last = submittedComments(thread).at(-1)
  return !thread.isResolved && Boolean(last) && isOwnPost(last, viewer) && last.body.includes(WAITING_MARKER)
}

function unansweredThreads(pull, viewer) {
  return pull.threads
    .filter((thread) => !threadAnswered(thread, viewer))
    .map((thread) => ({ thread_id: thread.id, path: thread.path, line: thread.line, comment_id: submittedComments(thread)[0].databaseId }))
}

function hasOpenWork(report) {
  return report.threads.length > 0 || report.pm_comments.length > 0
}

function roundMarkers(issueComments) {
  const found = new Set()
  for (const comment of issueComments) {
    for (const match of (comment.body || '').matchAll(ROUND_MARKER_RE)) found.add(Number(match[1]))
  }
  return found
}

// The agent's judged severities, from the hidden markers on its own replies and PR comments.
function severityMarkers(posts, viewer) {
  const found = {}
  for (const post of posts) {
    if (!isOwnPost(post, viewer)) continue
    for (const [, pairs] of (post.body || '').matchAll(SEVERITY_MARKER_RE)) {
      for (const pair of pairs.split(/\s+/)) {
        const at = pair.lastIndexOf('=')
        if (at > 0 && SEVERITIES.includes(pair.slice(at + 1))) found[pair.slice(0, at)] = pair.slice(at + 1)
      }
    }
  }
  return found
}

// The continue signal: the latest removal of the halted label, by `continue` or by hand on GitHub.
function continuedAt(events) {
  const times = events
    .filter((event) => event.event === 'unlabeled' && event.label?.name === HALTED)
    .map((event) => Date.parse(event.created_at))
  return times.length ? Math.max(...times) : null
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
// A finding with no known severity (a past one with neither badge nor marker) is never noise.
function classifyRound(findings, reviewer, isFirst, carriedOver) {
  if (isFirst) return 'first'
  if (reviewer === 'human') return 'human'
  if (findings.some((finding) => finding.severity !== 'Low')) return 'signal'
  if (findings.length) return 'noise'
  return carriedOver ? 'carry_over' : 'quiet'
}

function parseAssumptions(values, flag = '--assume') {
  const assumed = {}
  for (const value of values) {
    const at = value.lastIndexOf('=')
    const severity = value.slice(at + 1)
    if (at < 1 || !SEVERITIES.includes(severity)) {
      throw new UsageError(`${flag} ${value}: expected KEY=${SEVERITIES.join('|')}`)
    }
    assumed[value.slice(0, at)] = severity
  }
  return assumed
}

// ---------------------------------------------------------------- deriving the PR's state from GitHub

function isCopilotError(review) {
  const body = review.body || ''
  return isCopilot(review) && body.includes('encountered an error') && !body.includes('ccr-overview')
}

function buildRound(review, comments, viewer, threadOf) {
  const answerable = comments.filter(
    (comment) =>
      comment.pull_request_review_id === review.id && !(comment.in_reply_to_id && isOwnPost(comment, viewer)),
  )
  if (!answerable.length && !(review.body || '').trim()) return null
  const reviewer = isAiReview(review) ? 'ai' : 'human'
  const { findings, recognised } = isCopilot(review)
    ? parseCopilotOverview(review.body || '')
    : parseReview(review, answerable)
  return {
    review_id: review.id,
    reviewer,
    author: review.user?.login ?? null,
    commit: (review.commit_id || '').slice(0, 7),
    submitted_at: review.submitted_at,
    format_recognised: recognised,
    findings,
    thread_ids: [...new Set(answerable.map((comment) => threadOf.get(comment.id)?.id).filter(Boolean))],
  }
}

// Severity: the agent's marker wins, then the reviewer's badge; an unhandled round may take --assume.
function applySeverities(round, markers, assumed) {
  for (const finding of round.findings) {
    if (markers[finding.key]) {
      finding.severity = markers[finding.key]
      finding.severity_source = 'agent'
    } else if (finding.severity === null && !round.handled && assumed[finding.key]) {
      finding.severity = assumed[finding.key]
      finding.severity_source = 'agent'
    }
  }
  round.unknown_severity =
    round.reviewer === 'ai' && !round.handled ? round.findings.filter((finding) => finding.severity === null).map((finding) => finding.key) : []
}

// Walk every round in order. A round submitted after the latest continue (removal of the halted label) halts the
// PR once the counts reach a limit; rounds submitted at or before it are exempt and never trigger a halt.
function applyLimits(rounds, continued) {
  let noise = 0
  let halt = null
  rounds.forEach((round, index) => {
    round.kind = classifyRound(round.findings, round.reviewer, index === 0, rounds.slice(0, index).some((earlier) => !earlier.handled))
    if (round.kind === 'noise') noise += 1
    const exempt = continued !== null && Date.parse(round.submitted_at) <= continued
    if (halt || exempt) return
    if (index + 1 >= ROUND_LIMIT) halt = `Round limit (${ROUND_LIMIT} rounds) reached`
    else if (noise >= NOISE_LIMIT) halt = `Noise limit (${NOISE_LIMIT} noise rounds) reached`
  })
  return { noise_count: noise, halt }
}

// One read of the PR: every submitted review rebuilt into rounds, each marked handled once its threads are
// answered and any due PR comment is posted, plus the open work `check` and the Stop hook report.
function derive(github, repo, pr, { assumed = {}, pull = github.pullRequest(repo, pr) } = {}) {
  const viewer = github.viewer()
  const reviews = github
    .reviews(repo, pr)
    .filter((review) => review.submitted_at && review.state !== 'PENDING')
    .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at))
  const comments = reviews.length ? github.reviewComments(repo, pr) : []
  const issueComments = github.issueComments(repo, pr)
  const posted = roundMarkers(issueComments)
  const markers = severityMarkers([...comments, ...issueComments], viewer)
  const threadOf = new Map()
  for (const thread of pull.threads) for (const comment of thread.comments) threadOf.set(comment.databaseId, thread)

  const rounds = []
  const errored = []
  for (const review of reviews) {
    if (isCopilotError(review)) {
      errored.push(review)
      continue
    }
    const round = buildRound(review, comments, viewer, threadOf)
    if (!round) continue
    round.pm_comment_due =
      round.format_recognised && round.findings.some((finding) => finding.kind === 'previously_missed' || finding.kind === 'review_body')
    round.handled =
      round.thread_ids.every((id) => threadAnswered(pull.threads.find((thread) => thread.id === id), viewer)) &&
      !(round.pm_comment_due && !posted.has(round.review_id))
    applySeverities(round, markers, assumed)
    rounds.push(round)
  }

  // A Copilot error stays reported until a later Copilot review replaces it.
  const lastCopilot = rounds.filter((round) => COPILOT_LOGINS.has(round.author)).at(-1)
  const copilotErrors = errored
    .filter((review) => !lastCopilot || Date.parse(review.submitted_at) > Date.parse(lastCopilot.submitted_at))
    .map((review) => review.id)

  const report = { pr_state: pull.state, threads: [], pm_comments: [], waiting: [], human_review_in_progress: false }
  if (pull.state === 'OPEN') {
    if (pull.pending) report.human_review_in_progress = true
    else {
      report.threads = unansweredThreads(pull, viewer)
      report.pm_comments = rounds
        .filter((round) => round.pm_comment_due && !posted.has(round.review_id))
        .map((round) => round.review_id)
        .sort((a, b) => a - b)
      report.waiting = pull.threads.filter((thread) => isWaiting(thread, viewer)).map((thread) => thread.id)
    }
  }
  return { pull, rounds, copilotErrors, report, continued: continuedAt(github.issueEvents(repo, pr)) }
}

function publicRound({ handled, ...round }) {
  return round
}

function swapLabels(github, repo, pr, labels, add, remove) {
  if (!labels.includes(add)) github.addLabel(repo, pr, add)
  if (labels.includes(remove)) github.removeLabel(repo, pr, remove)
}

// ---------------------------------------------------------------- agent-facing commands

function ingest(ctx, args) {
  const { github } = ctx
  checkRepo(args.repo)
  const derived = derive(github, args.repo, args.pr, { assumed: parseAssumptions(args.assume) })
  const unhandled = derived.rounds.filter((round) => !round.handled)
  const plan = {
    action: 'nothing',
    instruction: null,
    rounds: [],
    noise_count: 0,
    noise_limit: NOISE_LIMIT,
    round_count: derived.rounds.length,
    round_limit: ROUND_LIMIT,
    halted: false,
    continued_at: derived.continued === null ? null : new Date(derived.continued).toISOString(),
  }
  if (derived.copilotErrors.length) plan.copilot_errors = derived.copilotErrors

  const drifted = unhandled.find((round) => !round.format_recognised)
  if (drifted) {
    plan.action = 'format_drift'
    plan.instruction =
      `Copilot's overview for review ${drifted.review_id} no longer parses. Tell the human the review format ` +
      'changed; answer the threads by hand with reply/check until the parser is fixed.'
    plan.rounds = [publicRound(drifted)]
    ctx.print(plan)
    return 2
  }
  if (unhandled.some((round) => round.unknown_severity.length)) {
    plan.action = 'judge_severity'
    plan.instruction =
      'Judge the severity of each finding in rounds[].unknown_severity yourself, then re-run ingest with ' +
      '--assume <key>=High|Medium|Low for each. When you answer, pass the same severity to reply/pr-comment ' +
      'with --severity, so later runs read it from GitHub.'
    plan.rounds = unhandled.map(publicRound)
    ctx.print(plan)
    return 0
  }

  const { noise_count, halt } = applyLimits(derived.rounds, derived.continued)
  plan.noise_count = noise_count
  plan.rounds = unhandled.map(publicRound)
  if (halt) {
    plan.halted = true
    plan.action = 'halt'
    plan.instruction =
      `${halt}. Leave these findings as they are. Call mcp__ccd_pr__set_monitor with auto_fix=false, ` +
      `address_comments=false, url=${prUrl(args.repo, args.pr)}; then hand back to the human in your final ` +
      "message, listing what is still open. Act again only after the human says 'continue'."
    swapLabels(github, args.repo, args.pr, derived.pull.labels, HALTED, ACTIVE)
  } else if (unhandled.length || hasOpenWork(derived.report)) {
    plan.action = 'handle'
  } else if (plan.copilot_errors) {
    plan.action = 'copilot_error'
    plan.instruction = 'Copilot failed to review. Tell the human to re-request the Copilot review.'
  }
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

// The visible badge and the hidden marker that later runs read the agent's severity back from.
function severityBlock(severities) {
  const keys = Object.keys(severities)
  if (!keys.length) return ''
  const visible =
    keys.length === 1
      ? `**Severity: ${severities[keys[0]]}** (agent-judged)`
      : keys.map((key) => `- \`${key}\`: **Severity: ${severities[key]}** (agent-judged)`).join('\n')
  const pairs = keys.map((key) => `${key}=${severities[key]}`).join(' ')
  return `\n\n${visible}\n<!-- shepherding-pr-reviews: severity ${pairs} -->`
}

function reply(ctx, args) {
  const { github } = ctx
  if (!args['body-file'] && !args.waiting) throw new UsageError('reply: --body-file is required')
  if (args.severity && !SEVERITIES.includes(args.severity)) {
    throw new UsageError(`reply: --severity must be one of ${SEVERITIES.join('|')}`)
  }
  const thread = github.threadPullRequest(args.thread)
  refuseDuringHumanReview(thread.pending)
  let body = withBanner(args['body-file'] ? fs.readFileSync(args['body-file'], 'utf8') : WAITING_TEXT)
  if (args.severity) body += severityBlock({ [`r${thread.comment_id}`]: args.severity })
  if (args.waiting) body += `\n\n${WAITING_MARKER}`
  github.replyToThread(args.thread, body)
  if (args.resolve) github.resolveThread(args.thread)
  ctx.print({ thread: args.thread, replied: true, resolved: Boolean(args.resolve), waiting: Boolean(args.waiting) })
  return 0
}

function prComment(ctx, args) {
  const { github } = ctx
  checkRepo(args.repo)
  const severities = parseAssumptions(args.severity, '--severity')
  refuseDuringHumanReview(github.pullRequest(args.repo, args.pr).pending)
  const body = withBanner(fs.readFileSync(args['body-file'], 'utf8')) + severityBlock(severities)
  github.commentOnPr(args.repo, args.pr, `${body}\n\n<!-- shepherding-pr-reviews: review ${args.review} -->`)
  ctx.print({ review: args.review, commented: true })
  return 0
}

// The active label is cosmetic: a failure to write it never fails the bind. A halted PR keeps its halted label,
// since swapping it out would be a continue.
function markActive(ctx, repo, pr, labels) {
  try {
    if (!labels().includes(HALTED)) ctx.github.addLabel(repo, pr, ACTIVE)
  } catch (error) {
    ctx.stderr.write(`shepherding-pr-reviews: could not label ${prUrl(repo, pr)}: ${error.message}\n`)
  }
}

function bind(ctx, args) {
  const file = bindSession(ctx.env, args.repo, args.pr, args['session-id'])
  markActive(ctx, args.repo, args.pr, () => ctx.github.pullRequest(args.repo, args.pr).labels)
  ctx.print({ bound: { repo: args.repo, pr: args.pr }, index: file, session_id: args['session-id'] })
  return 0
}

function check(ctx, args) {
  checkRepo(args.repo)
  const { report } = derive(ctx.github, args.repo, args.pr)
  const done = !hasOpenWork(report)
  report.ok = done
  ctx.print(report)
  return done ? 0 : 1
}

function continueRound(ctx, args) {
  checkRepo(args.repo)
  const { labels } = ctx.github.pullRequest(args.repo, args.pr)
  swapLabels(ctx.github, args.repo, args.pr, labels, ACTIVE, HALTED)
  ctx.print({
    continued: true,
    note:
      'One round allowed: reviews submitted so far no longer trigger a halt, and the next review re-checks the ' +
      'limits. Auto-Fix stays off; only the human re-arms it.',
  })
  return 0
}

function status(ctx, args) {
  checkRepo(args.repo)
  const derived = derive(ctx.github, args.repo, args.pr)
  const { noise_count, halt } = applyLimits(derived.rounds, derived.continued)
  ctx.print({
    repo: args.repo,
    pr: args.pr,
    url: prUrl(args.repo, args.pr),
    labels: derived.pull.labels,
    halted: Boolean(halt),
    halt_reason: halt,
    continued_at: derived.continued === null ? null : new Date(derived.continued).toISOString(),
    noise_count,
    noise_limit: NOISE_LIMIT,
    round_count: derived.rounds.length,
    round_limit: ROUND_LIMIT,
    rounds: derived.rounds.map(({ findings, ...round }) => ({
      ...round,
      findings: findings.map(({ key, kind, severity, title }) => ({ key, kind, severity, title })),
    })),
    copilot_errors: derived.copilotErrors,
    open: derived.report,
  })
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
  bindSession(ctx.env, repo, pr, payload.session_id)
  // A PR gh pr create just opened carries no labels yet.
  markActive(ctx, repo, pr, () => [])
  const url = prUrl(repo, pr)
  const context =
    `PR ${url} was created and bound to this session. Load the shepherding-pr-reviews skill now and arm the ` +
    `Auto-Fix Watch: call mcp__ccd_pr__set_monitor with auto_fix=true, address_comments=true, url=${url}. ` +
    'When that tool is unavailable (a CLI session), tell the human the Auto-Fix Watch is not armed and that ' +
    'review rounds run when they say reviews have landed.'
  ctx.emit({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } })
  return 0
}

function hookStop(ctx) {
  const payload = ctx.readPayload()
  if (!payload.session_id) return 0
  const index = sessionIndexPath(ctx.env, payload.session_id)
  const entries = readSessionIndex(index)
  if (!entries.length) return 0
  const kept = []
  const problems = []
  for (const entry of entries) {
    const url = prUrl(entry.repo, entry.pr)
    let report
    try {
      const pull = ctx.github.pullRequest(entry.repo, entry.pr)
      if (pull.state !== 'OPEN') continue
      kept.push(entry)
      // A halted PR keeps its open findings by design. The label is the only state the hook reads.
      if (pull.labels.includes(HALTED)) continue
      report = derive(ctx.github, entry.repo, entry.pr, { pull }).report
    } catch (error) {
      // GitHub unreachable: let the stop through rather than trap the session.
      if (!kept.includes(entry)) kept.push(entry)
      ctx.stderr.write(`shepherding-pr-reviews: stop check skipped for ${url}: ${error.message}\n`)
      continue
    }
    if (hasOpenWork(report)) {
      problems.push(
        `${url}: ${report.threads.length} unanswered thread(s) ` +
          `[${report.threads.map((thread) => thread.thread_id).join(', ')}], ` +
          `PR comment due for review(s) [${report.pm_comments.join(', ')}]`,
      )
    }
  }
  if (kept.length !== entries.length) writeSessionIndex(index, kept)
  if (problems.length) {
    const reason =
      'Review threads still need an answer (shepherding-pr-reviews skill). Reply in-thread and resolve, or post ' +
      "a holding reply (`reply --waiting`) on a human reviewer's thread that needs the human's decision:\n- " +
      problems.join('\n- ')
    ctx.emit({ decision: 'block', reason })
  }
  return 0
}

// ---------------------------------------------------------------- GitHub port (gh CLI)

const THREADS_QUERY = `query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){
  state
  pending:reviews(states:[PENDING],first:1){totalCount}
  labels(first:50){nodes{name}}
  reviewThreads(first:100){nodes{
    id isResolved path line
    comments(last:50){nodes{databaseId state author{login} body}}
  }}
}}}`
const THREAD_PR_QUERY = `query($t:ID!){node(id:$t){... on PullRequestReviewThread{
  comments(first:1){nodes{databaseId}}
  pullRequest{pending:reviews(states:[PENDING],first:1){totalCount}}
}}}`

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
    issueEvents: (repo, pr) => restList(`repos/${repo}/issues/${pr}/events`),
    pullRequest(repo, pr) {
      const [o, r] = repo.split('/')
      const pull = graphql(THREADS_QUERY, { o, r, n: pr }).repository.pullRequest
      return {
        state: pull.state,
        pending: pull.pending.totalCount,
        labels: pull.labels.nodes.map((label) => label.name),
        threads: pull.reviewThreads.nodes.map((thread) => ({ ...thread, comments: thread.comments.nodes })),
      }
    },
    threadPullRequest(threadId) {
      const thread = graphql(THREAD_PR_QUERY, { t: threadId }).node
      return { pending: thread.pullRequest.pending.totalCount, comment_id: thread.comments.nodes[0]?.databaseId }
    },
    addLabel(repo, pr, name) {
      const { color, description } = LABELS[name]
      gh(['label', 'create', name, '--repo', repo, '--color', color, '--description', description, '--force'])
      gh(['api', '-X', 'POST', `repos/${repo}/issues/${pr}/labels`, '-f', `labels[]=${name}`])
    },
    removeLabel(repo, pr, name) {
      try {
        gh(['api', '-X', 'DELETE', `repos/${repo}/issues/${pr}/labels/${encodeURIComponent(name)}`])
      } catch (error) {
        // Already gone: nothing to remove.
        if (!/HTTP 404/.test(`${error.stderr || ''}${error.message}`)) throw error
      }
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
  reply: {
    run: reply,
    options: { thread: 'required', 'body-file': 'optional', resolve: 'flag', severity: 'optional', waiting: 'flag' },
  },
  'pr-comment': {
    run: prComment,
    pr: true,
    options: { review: 'number', 'body-file': 'required', severity: 'list' },
  },
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
    const args = parseArgs(name, command, rest)
    deleteLegacyState(ctx.env)
    return command.run(ctx, args)
  } catch (error) {
    stderr.write(`review-state: ${error.message}\n`)
    return error instanceof UsageError ? 2 : 1
  }
}

module.exports = { BANNER, main }

if (require.main === module) process.exitCode = main(process.argv.slice(2))
