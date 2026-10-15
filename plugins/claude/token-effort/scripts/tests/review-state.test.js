const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

const SKILLS = path.join(__dirname, '..', '..', 'skills')
const SCRIPT = path.join(SKILLS, 'shepherding-pr-reviews', 'scripts', 'review-state.js')
const SUBCOMMANDS = ['ingest', 'reply', 'pr-comment', 'bind', 'check', 'continue', 'status', 'hook-post-create', 'hook-stop']

function configDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'review-state-'))
}

function runCli(args, input, config = configDir()) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    input: input === undefined ? '' : JSON.stringify(input),
    env: { ...process.env, CLAUDE_CONFIG_DIR: config },
  })
}

const { BANNER, main } = require(SCRIPT)

const REPO = 'octo-org/widgets'
const PR = 7
const VIEWER = 'agent-user'
const PR_ARGS = ['--repo', REPO, '--pr', String(PR)]

const HALTED = 'shepherd: halted'
const ACTIVE = 'shepherd: active'

// An in-memory GitHub with one open PR, standing in for the gh CLI port.
function fakeGithub() {
  let nextId = 100
  const pull = { state: 'OPEN', pending: 0, reviews: [], reviewComments: [], threads: [], issueComments: [], labels: [], events: [] }
  // Every write happens one second after the last, so timestamps order like GitHub's.
  const now = () => new Date(Date.UTC(2026, 9, 14, 10) + nextId++ * 1000).toISOString().replace(/\.\d+Z$/, 'Z')

  function addComment(review, thread, login, body) {
    const id = nextId++
    const inReplyTo = thread.comments[0]?.databaseId
    thread.comments.push({ databaseId: id, state: 'SUBMITTED', author: { login }, body })
    pull.reviewComments.push({ id, in_reply_to_id: inReplyTo, pull_request_review_id: review.id, user: { login }, body, path: thread.path, line: thread.line })
  }

  function addReview({ login, type = 'User', body = '', state = 'COMMENTED', comments = [] }) {
    const review = { id: nextId++, user: { login, type }, body, state, submitted_at: now(), commit_id: 'abcdef1234' }
    pull.reviews.push(review)
    for (const comment of comments) {
      const thread = { id: `PRRT_${nextId++}`, isResolved: false, path: comment.path || 'src/app.js', line: 3, comments: [] }
      pull.threads.push(thread)
      addComment(review, thread, login, comment.body)
    }
    return review
  }

  function replyToThread(threadId, body, login = VIEWER) {
    const thread = pull.threads.find((candidate) => candidate.id === threadId)
    addComment(addReview({ login }), thread, login, body)
  }

  return {
    pull,
    addReview,
    viewer: () => VIEWER,
    reviews: () => pull.reviews,
    reviewComments: () => pull.reviewComments,
    issueComments: () => pull.issueComments,
    issueEvents: () => pull.events,
    pullRequest: () => ({ state: pull.state, pending: pull.pending, threads: pull.threads, labels: [...pull.labels] }),
    threadPullRequest: (threadId) => ({
      pending: pull.pending,
      comment_id: pull.threads.find((thread) => thread.id === threadId).comments[0].databaseId,
    }),
    replyToThread,
    resolveThread(threadId) {
      pull.threads.find((thread) => thread.id === threadId).isResolved = true
    },
    commentOnPr(repo, pr, body) {
      pull.issueComments.push({ user: { login: VIEWER }, body })
    },
    addLabel(repo, pr, name) {
      if (pull.labels.includes(name)) return
      pull.labels.push(name)
      pull.events.push({ event: 'labeled', label: { name }, created_at: now() })
    },
    removeLabel(repo, pr, name) {
      if (!pull.labels.includes(name)) return
      pull.labels = pull.labels.filter((label) => label !== name)
      pull.events.push({ event: 'unlabeled', label: { name }, created_at: now() })
    },
  }
}

function capture() {
  let text = ''
  return { write: (chunk) => (text += chunk), get text() { return text } }
}

function makeRunner(github = fakeGithub(), config = configDir()) {
  const run = (args, payload) => {
    const stdout = capture()
    const stderr = capture()
    const status = main(args, {
      github,
      env: { CLAUDE_CONFIG_DIR: config },
      stdin: payload === undefined ? '' : JSON.stringify(payload),
      stdout,
      stderr,
    })
    return { status, stdout: stdout.text, stderr: stderr.text, json: () => JSON.parse(stdout.text) }
  }
  run.config = config
  return run
}

function createPr(run, sessionId = 'session-1') {
  return run(['hook-post-create'], {
    session_id: sessionId,
    tool_name: 'Bash',
    tool_input: { command: 'gh pr create --fill' },
    tool_response: { stdout: `https://github.com/${REPO}/pull/${PR}\n` },
  })
}

function sessionsDir(config) {
  return path.join(config, 'state', 'shepherding-pr-reviews', 'sessions')
}

function filesUnder(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter((name) => fs.statSync(path.join(dir, name)).isFile()) : []
}

function bodyFile(text) {
  const file = path.join(configDir(), 'body.md')
  fs.writeFileSync(file, text, 'utf8')
  return file
}

test('the banner matches the disclose-ai-content skill', () => {
  const skill = fs.readFileSync(path.join(SKILLS, '..', '..', '..', '..', 'skills', 'disclose-ai-content', 'SKILL.md'), 'utf8')
  const exact = skill.match(/\*\*Exact text:\*\*\s*```\s*\n(.*)\n```/)

  assert.ok(exact, 'disclose-ai-content SKILL.md has no "Exact text" block')
  assert.equal(BANNER, exact[1])
})

test('hook-stop blocks on an unanswered thread until it is replied to and resolved', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'This loop never ends.' }] })
  const run = makeRunner(github)
  const created = run(['hook-post-create'], {
    session_id: 'session-1',
    tool_name: 'Bash',
    tool_input: { command: 'gh pr create --fill' },
    tool_response: { stdout: `https://github.com/${REPO}/pull/${PR}\n` },
  })
  assert.match(created.json().hookSpecificOutput.additionalContext, /shepherding-pr-reviews/)

  const blocked = run(['hook-stop'], { session_id: 'session-1' })
  assert.equal(blocked.json().decision, 'block')
  assert.match(blocked.json().reason, new RegExp(github.pull.threads[0].id))

  const threadId = github.pull.threads[0].id
  assert.equal(run(['reply', '--thread', threadId, '--body-file', bodyFile('Fixed in abc1234.'), '--resolve']).status, 0)
  const checked = run(['check', ...PR_ARGS])
  assert.equal(checked.json().ok, true)
  assert.equal(checked.status, 0)

  const released = run(['hook-stop'], { session_id: 'session-1' })
  assert.equal(released.status, 0)
  assert.equal(released.stdout, '')
})

test('reply prepends the banner once', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Rename this.' }] })
  const run = makeRunner(github)
  const threadId = github.pull.threads[0].id

  run(['reply', '--thread', threadId, '--body-file', bodyFile('Renamed.')])
  run(['reply', '--thread', threadId, '--body-file', bodyFile(`${BANNER}\n\nAlready disclosed.`)])

  const [, first, second] = github.pull.threads[0].comments.map((comment) => comment.body)
  assert.equal(first, `${BANNER}\n\nRenamed.`)
  assert.equal(second, `${BANNER}\n\nAlready disclosed.`)
})

const LOW = '<img alt="Low severity" src="low.svg">'
const HIGH = '<img alt="High severity" src="high.svg">'

test('a human review with a comment is a round', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Handle the empty list.' }] })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.action, 'handle')
  assert.equal(plan.round_count, 1)
  assert.equal(plan.rounds[0].reviewer, 'human')
})

test('an empty approval is not a round', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', state: 'APPROVED' })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.action, 'nothing')
  assert.equal(plan.round_count, 0)
})

test("a banner reply by the gh user is the agent's own post, not a round", () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Rename this.' }] })
  const run = makeRunner(github)
  run(['ingest', ...PR_ARGS])

  run(['reply', '--thread', github.pull.threads[0].id, '--body-file', bodyFile('Renamed in abc1234.')])
  const plan = run(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.round_count, 1)
  assert.deepEqual(plan.rounds, [])
  assert.equal(plan.action, 'nothing')
})

test('a submitted review that starts with the banner is an AI round', () => {
  const github = fakeGithub()
  github.addReview({ login: VIEWER, body: `${BANNER}\n\n${HIGH} One finding.`, comments: [{ body: `${BANNER}\n\n${HIGH} Off by one.` }] })
  const run = makeRunner(github)

  const plan = run(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.round_count, 1)
  assert.equal(plan.rounds[0].reviewer, 'ai')
  assert.deepEqual(plan.rounds[0].findings.map((finding) => finding.title), ['Off by one.', 'One finding.'])
  assert.equal(run(['check', ...PR_ARGS]).json().threads.length, 1)
})

test('a bot review is an AI round', () => {
  const github = fakeGithub()
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Null dereference.` }] })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.rounds[0].reviewer, 'ai')
  assert.equal(plan.rounds[0].findings[0].severity, 'High')
})

test('an AI finding without a badge waits for the agent to judge its severity', () => {
  const github = fakeGithub()
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: 'Consider a constant.' }] })
  const run = makeRunner(github)

  const judging = run(['ingest', ...PR_ARGS])
  assert.equal(judging.status, 0)
  assert.equal(judging.json().action, 'judge_severity')
  const [key] = judging.json().rounds[0].unknown_severity

  const plan = run(['ingest', ...PR_ARGS, '--assume', `${key}=Medium`]).json()
  assert.equal(plan.action, 'handle')
  assert.equal(plan.rounds[0].findings[0].severity, 'Medium')
  assert.equal(plan.round_count, 1)
})

test('an all-Low AI round after the first round is noise', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Handle the empty list.' }] })
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${LOW} Typo in a comment.` }] })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.deepEqual(plan.rounds.map((round) => round.kind), ['first', 'noise'])
  assert.equal(plan.noise_count, 1)
})

test('an all-Low human round is never noise', () => {
  const github = fakeGithub()
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Null dereference.` }] })
  github.addReview({ login: 'reviewer-human', comments: [{ body: `${LOW} Typo in a comment.` }] })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.rounds[1].kind, 'human')
  assert.equal(plan.noise_count, 0)
})

test('the noise limit halts with a Noise limit instruction', () => {
  const github = fakeGithub()
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Null dereference.` }] })
  for (let i = 0; i < 3; i++) github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${LOW} Nit ${i}.` }] })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.action, 'halt')
  assert.match(plan.instruction, /^Noise limit/)
  assert.equal(plan.noise_count, 3)
})

test('the round limit halts with a Round limit instruction', () => {
  const github = fakeGithub()
  for (let i = 0; i < 10; i++) github.addReview({ login: 'reviewer-human', comments: [{ body: `Point ${i}.` }] })

  const plan = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.action, 'halt')
  assert.match(plan.instruction, /^Round limit/)
  assert.equal(plan.round_count, 10)
})

test('after a halt, continue allows exactly one more round', () => {
  const github = fakeGithub()
  for (let i = 0; i < 10; i++) github.addReview({ login: 'reviewer-human', body: `Point ${i}.` })
  const run = makeRunner(github)
  run(['ingest', ...PR_ARGS])
  for (const review of github.pull.reviews) run(['pr-comment', ...PR_ARGS, '--review', String(review.id), '--body-file', bodyFile('Answered.')])

  github.addReview({ login: 'reviewer-human', body: 'One more.' })
  assert.equal(run(['ingest', ...PR_ARGS]).json().action, 'halt')
  run(['continue', ...PR_ARGS])
  const allowed = run(['ingest', ...PR_ARGS]).json()
  assert.equal(allowed.action, 'handle')
  assert.equal(allowed.rounds.length, 1)

  github.addReview({ login: 'reviewer-human', body: 'And another.' })
  assert.equal(run(['ingest', ...PR_ARGS]).json().action, 'halt')
})

function noisyPr() {
  const github = fakeGithub()
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Null dereference.` }] })
  for (let i = 0; i < 3; i++) github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${LOW} Nit ${i}.` }] })
  return github
}

test('a halt swaps shepherd: active for shepherd: halted, and continue swaps it back', () => {
  const github = noisyPr()
  const run = makeRunner(github)
  createPr(run)
  assert.deepEqual(github.pull.labels, [ACTIVE])

  assert.equal(run(['ingest', ...PR_ARGS]).json().action, 'halt')
  assert.deepEqual(github.pull.labels, [HALTED])

  run(['continue', ...PR_ARGS])
  assert.deepEqual(github.pull.labels, [ACTIVE])
})

test('removing shepherd: halted by hand on GitHub allows one more round, and the next review re-halts', () => {
  const github = noisyPr()
  const run = makeRunner(github)
  assert.equal(run(['ingest', ...PR_ARGS]).json().action, 'halt')

  github.removeLabel(REPO, PR, HALTED)
  const allowed = run(['ingest', ...PR_ARGS]).json()
  assert.equal(allowed.action, 'handle')
  assert.equal(allowed.halted, false)

  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Race condition.` }] })
  assert.equal(run(['ingest', ...PR_ARGS]).json().action, 'halt')
  assert.deepEqual(github.pull.labels, [HALTED])
})

test('a halt still prints its instruction when the label write fails', () => {
  const github = noisyPr()
  github.addLabel = () => {
    throw new Error('HTTP 403')
  }
  const result = makeRunner(github)(['ingest', ...PR_ARGS])

  assert.equal(result.status, 0)
  assert.equal(result.json().action, 'halt')
  assert.match(result.stderr, /could not label/)
})

test('a bad --repo is refused before GitHub is called', () => {
  const result = makeRunner()(['check', '--repo', 'not-a-repo', '--pr', '7'])

  assert.equal(result.status, 2)
  assert.match(result.stderr, /expected owner\/name/)
})

test('no per-PR state is written: only the session index, listing the PR', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Rename this.' }] })
  const run = makeRunner(github)
  createPr(run)
  run(['ingest', ...PR_ARGS])
  run(['check', ...PR_ARGS])

  const root = path.join(run.config, 'state', 'shepherding-pr-reviews')
  assert.deepEqual(filesUnder(root), [path.join('sessions', 'session-1.json')])
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(sessionsDir(run.config), 'session-1.json'), 'utf8')), [{ repo: REPO, pr: PR }])
})

test('two runs with separate config dirs derive the same rounds, counts and halt', () => {
  const github = noisyPr()
  const first = makeRunner(github)(['ingest', ...PR_ARGS]).json()
  const second = makeRunner(github)(['ingest', ...PR_ARGS]).json()

  assert.equal(first.action, 'halt')
  assert.deepEqual(second, first)
})

test('old per-PR state files are deleted on first run', () => {
  const run = makeRunner()
  const old = path.join(run.config, 'state', 'shepherding-pr-reviews', 'prs', 'octo-org', 'widgets', '7.json')
  fs.mkdirSync(path.dirname(old), { recursive: true })
  fs.writeFileSync(old, '{}', 'utf8')

  run(['check', ...PR_ARGS])

  assert.equal(fs.existsSync(path.dirname(path.dirname(path.dirname(old)))), false)
})

test('a reply with --severity carries a visible badge and a hidden marker', () => {
  const github = fakeGithub()
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Null dereference.` }] })
  const run = makeRunner(github)
  const thread = github.pull.threads[0]

  run(['reply', '--thread', thread.id, '--body-file', bodyFile('Fixed in abc1234.'), '--severity', 'Low'])

  const body = thread.comments.at(-1).body
  assert.match(body, /\*\*Severity: Low\*\* \(agent-judged\)/)
  assert.ok(body.includes(`<!-- shepherding-pr-reviews: severity r${thread.comments[0].databaseId}=Low -->`))
})

test("the agent's severity marker overrides the reviewer's badge when counting noise", () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Handle the empty list.' }] })
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: `${HIGH} Null dereference.` }] })
  const run = makeRunner(github)
  assert.equal(run(['ingest', ...PR_ARGS]).json().noise_count, 0)

  for (const thread of github.pull.threads) {
    run(['reply', '--thread', thread.id, '--body-file', bodyFile('Answered.'), '--severity', 'Low', '--resolve'])
  }

  assert.equal(run(['ingest', ...PR_ARGS]).json().noise_count, 1)
})

test('pr-comment carries one severity marker per finding key', () => {
  const github = fakeGithub()
  const review = github.addReview({ login: 'review-bot[bot]', type: 'Bot', body: 'Consider caching.' })
  const run = makeRunner(github)

  run(['pr-comment', ...PR_ARGS, '--review', String(review.id), '--body-file', bodyFile('Not valid.'), '--severity', `review:${review.id}=Low`])

  const body = github.pull.issueComments[0].body
  assert.match(body, /\*\*Severity: Low\*\* \(agent-judged\)/)
  assert.ok(body.includes(`<!-- shepherding-pr-reviews: severity review:${review.id}=Low -->`))
  assert.ok(body.includes(`<!-- shepherding-pr-reviews: review ${review.id} -->`))
})

test('a past AI finding with no badge and no marker is not noise', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Handle the empty list.' }] })
  github.addReview({ login: 'review-bot[bot]', type: 'Bot', comments: [{ body: 'Consider a constant.' }] })
  const run = makeRunner(github)
  for (const thread of github.pull.threads) run(['reply', '--thread', thread.id, '--body-file', bodyFile('Answered.'), '--resolve'])

  const plan = run(['ingest', ...PR_ARGS]).json()

  assert.equal(plan.action, 'nothing')
  assert.equal(plan.noise_count, 0)
  assert.equal(plan.round_count, 2)
})

test("a holding reply parks a human's thread until the reviewer replies", () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'Use a map here.' }] })
  const run = makeRunner(github)
  createPr(run)
  const thread = github.pull.threads[0]

  run(['reply', '--thread', thread.id, '--waiting'])
  assert.match(thread.comments.at(-1).body, /<!-- shepherding-pr-reviews: waiting -->/)
  assert.equal(run(['check', ...PR_ARGS]).json().ok, true)
  assert.equal(run(['hook-stop'], { session_id: 'session-1' }).stdout, '')

  github.replyToThread(thread.id, 'A map is clearer; please change it.', 'reviewer-human')
  assert.deepEqual(run(['check', ...PR_ARGS]).json().threads.map((open) => open.thread_id), [thread.id])
  assert.equal(run(['hook-stop'], { session_id: 'session-1' }).json().decision, 'block')
})

test('hook-stop skips a PR labelled shepherd: halted', () => {
  const github = fakeGithub()
  github.addReview({ login: 'reviewer-human', comments: [{ body: 'This loop never ends.' }] })
  const run = makeRunner(github)
  createPr(run)
  github.addLabel(REPO, PR, HALTED)

  const result = run(['hook-stop'], { session_id: 'session-1' })

  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
})

test('hook-stop prunes a merged PR and deletes the emptied session file', () => {
  const github = fakeGithub()
  const run = makeRunner(github)
  createPr(run)
  github.pull.state = 'MERGED'

  run(['hook-stop'], { session_id: 'session-1' })

  assert.deepEqual(filesUnder(sessionsDir(run.config)), [])
})

test('bind sweeps session files untouched for 30 days, but keeps its own', () => {
  const run = makeRunner()
  createPr(run, 'old-session')
  const stale = path.join(sessionsDir(run.config), 'old-session.json')
  const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
  fs.utimesSync(stale, longAgo, longAgo)

  run(['bind', ...PR_ARGS, '--session-id', 'new-session'])

  assert.deepEqual(filesUnder(sessionsDir(run.config)), ['new-session.json'])
})

test('bind leaves shepherd: halted in place rather than continuing the PR', () => {
  const github = fakeGithub()
  github.addLabel(REPO, PR, HALTED)
  const run = makeRunner(github)

  run(['bind', ...PR_ARGS, '--session-id', 'session-1'])

  assert.deepEqual(github.pull.labels, [HALTED])
})

test('--help lists every subcommand', () => {
  const result = runCli(['--help'])

  assert.equal(result.status, 0, result.stderr)
  for (const name of SUBCOMMANDS) assert.match(result.stdout, new RegExp(`^  ${name} `, 'm'))
})

test('hook-post-create exits silently when no gh pr create ran', () => {
  const result = runCli(['hook-post-create'], {
    session_id: 'session-1',
    tool_name: 'Bash',
    tool_input: { command: 'git status' },
    tool_response: { stdout: 'On branch main' },
  })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, '')
  assert.equal(result.stderr, '')
})

for (const [name, command] of [
  ['a heredoc body', "python - <<'PY'\nsrc = 'gh pr create --fill'\nprint('https://github.com/owner/name/pull/42')\nPY"],
  ['an unquoted heredoc body', 'cat > notes.txt <<EOF\ngh pr create --fill\nEOF'],
  ['a quoted string', 'echo "run gh pr create next" && echo https://github.com/owner/name/pull/42'],
  ['a single-quoted script', "python -c 'print(\"gh pr create\")'"],
  ['a PowerShell here-string', "Set-Content notes.txt @'\ngh pr create --fill\n'@"],
]) {
  test(`hook-post-create ignores gh pr create inside ${name}`, () => {
    const result = runCli(['hook-post-create'], {
      session_id: 'session-1',
      tool_name: 'Bash',
      tool_input: { command },
      tool_response: { stdout: 'https://github.com/owner/name/pull/42\n' },
    })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, '')
  })
}

for (const command of [
  'git push -u origin HEAD && gh pr create --fill',
  'cd repo; GH_PROMPT_DISABLED=1 gh pr create --title "Fix" --body "$(cat <<\'EOF\'\nCloses #1\nEOF\n)"',
]) {
  test(`hook-post-create binds when gh pr create runs: ${command.split('\n')[0]}`, () => {
    const result = runCli(['hook-post-create'], {
      session_id: 'session-1',
      tool_name: 'Bash',
      tool_input: { command },
      tool_response: { stdout: `https://github.com/${REPO}/pull/${PR}\n` },
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /was created and bound/)
  })
}

test('hook-stop exits silently when no PR is bound to the session', () => {
  const result = runCli(['hook-stop'], { session_id: 'session-1', hook_event_name: 'Stop' })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, '')
  assert.equal(result.stderr, '')
})
