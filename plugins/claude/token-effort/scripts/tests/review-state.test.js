const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

const SKILLS = path.join(__dirname, '..', '..', 'skills')
const SCRIPT = path.join(SKILLS, 'shepherding-pr-reviews', 'scripts', 'review-state.js')
const SUBCOMMANDS = ['ingest', 'reply', 'pr-comment', 'wait', 'bind', 'check', 'continue', 'status', 'hook-post-create', 'hook-stop']

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

// An in-memory GitHub with one open PR, standing in for the gh CLI port.
function fakeGithub() {
  let nextId = 100
  const pull = { state: 'OPEN', pending: 0, reviews: [], reviewComments: [], threads: [], issueComments: [] }

  function addComment(review, thread, login, body) {
    const id = nextId++
    const inReplyTo = thread.comments[0]?.databaseId
    thread.comments.push({ databaseId: id, state: 'SUBMITTED', author: { login }, body })
    pull.reviewComments.push({ id, in_reply_to_id: inReplyTo, pull_request_review_id: review.id, user: { login }, body, path: thread.path, line: thread.line })
  }

  function addReview({ login, type = 'User', body = '', state = 'COMMENTED', comments = [] }) {
    const review = { id: nextId++, user: { login, type }, body, state, submitted_at: `2026-10-14T10:${String(nextId).padStart(2, '0')}:00Z`, commit_id: 'abcdef1234' }
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
    pullRequest: () => ({ state: pull.state, pending: pull.pending, threads: pull.threads }),
    threadPullRequest: () => ({ pending: pull.pending }),
    replyToThread,
    resolveThread(threadId) {
      pull.threads.find((thread) => thread.id === threadId).isResolved = true
    },
    commentOnPr(repo, pr, body) {
      pull.issueComments.push({ user: { login: VIEWER }, body })
    },
  }
}

function capture() {
  let text = ''
  return { write: (chunk) => (text += chunk), get text() { return text } }
}

function makeRunner(github = fakeGithub(), config = configDir()) {
  return (args, payload) => {
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
  assert.equal(run(['ingest', ...PR_ARGS]).json().action, 'handle')
})

test('PRs in different repos never share state, even when their names collide once joined', () => {
  const run = makeRunner()

  run(['wait', '--repo', 'a-b/c', '--pr', '7', '--thread', 'PRRT_1'])
  const other = run(['status', '--repo', 'a/b-c', '--pr', '7']).json()

  assert.deepEqual(other.waiting_on_user, [])
})

test('one PR has one state, whatever the case of its owner and repo', () => {
  const run = makeRunner()

  run(['wait', '--repo', 'Octo-Org/Widgets', '--pr', '7', '--thread', 'PRRT_1'])
  const same = run(['status', '--repo', 'octo-org/widgets', '--pr', '7']).json()

  assert.deepEqual(same.waiting_on_user, ['PRRT_1'])
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
