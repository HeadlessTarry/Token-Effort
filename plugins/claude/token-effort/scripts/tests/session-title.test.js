const assert = require('node:assert/strict')
const { test } = require('node:test')

const { formatTitle, hookOutput, issueRef } = require('../session-title.js')

const lookup = (title) => () => title

test('issueRef finds the issue in a slash command', () => {
  assert.equal(issueRef('/triage #123'), '123')
  assert.equal(issueRef('/mattpocock-skills:implement #456 please'), '456')
  assert.equal(issueRef('  /implement\n#7'), '7')
})

test('issueRef ignores prompts that are not slash commands', () => {
  assert.equal(issueRef('look at #123'), null)
  assert.equal(issueRef('/triage the backlog'), null)
  assert.equal(issueRef('/triage #abc'), null)
})

test('formatTitle keeps at most 8 words', () => {
  assert.equal(formatTitle('9', 'Add  the shepherding-pr-reviews skill '), '[#9] Add the shepherding-pr-reviews skill')
  assert.equal(formatTitle('9', 'one two three four five six seven eight nine ten'), '[#9] one two three four five six seven eight')
})

test('hookOutput sets the session title', () => {
  assert.deepEqual(hookOutput({ prompt: '/triage #12' }, lookup('Fix login')), {
    hookSpecificOutput: { hookEventName: 'UserPromptSubmit', sessionTitle: '[#12] Fix login' },
  })
})

test('hookOutput passes the issue number and cwd to the lookup', () => {
  const calls = []
  hookOutput({ prompt: '/triage #12', cwd: '/repo' }, (...args) => calls.push(args) && 'x')
  assert.deepEqual(calls, [['12', '/repo']])
})

test('hookOutput leaves an existing title alone', () => {
  assert.equal(hookOutput({ prompt: '/triage #12', session_title: 'Mine' }, lookup('Fix login')), null)
})

test('hookOutput emits nothing without an issue or a title', () => {
  assert.equal(hookOutput({ prompt: 'hello' }, lookup('Fix login')), null)
  assert.equal(hookOutput({}, lookup('Fix login')), null)
  assert.equal(hookOutput({ prompt: '/triage #12' }, lookup('  ')), null)
})
