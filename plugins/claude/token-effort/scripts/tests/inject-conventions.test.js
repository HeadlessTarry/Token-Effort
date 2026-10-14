const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

const SCRIPT = path.join(__dirname, '..', 'inject-conventions.js')
const AGENTS = '# Conventions\n\nSee `$AI_CONFIG_DIR/docs/agents/issue-tracker.md` and `$AI_CONFIG_DIR/docs/agents/triage-labels.md`.\n'

function pluginRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inject-conventions-'))
  fs.mkdirSync(path.join(root, 'config'))
  fs.writeFileSync(path.join(root, 'config', 'AGENTS.md'), AGENTS, 'utf8')
  return root
}

function run(root, args, input = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    input: JSON.stringify(input),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root },
  })
}

function expected(root) {
  const config = path.join(root, 'config')
  return `# Conventions\n\nSee \`${config}/docs/agents/issue-tracker.md\` and \`${config}/docs/agents/triage-labels.md\`.\n`
}

test('SessionStart prints the conventions with $AI_CONFIG_DIR replaced', () => {
  const root = pluginRoot()

  const result = run(root, ['SessionStart'], { hook_event_name: 'SessionStart', source: 'startup' })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, expected(root))
})

test('SubagentStart emits the conventions as additionalContext JSON', () => {
  const root = pluginRoot()

  const result = run(root, ['SubagentStart'], { hook_event_name: 'SubagentStart', agent_type: 'general-purpose' })

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: expected(root) },
  })
})

for (const agentType of ['Explore', 'Plan']) {
  test(`SubagentStart emits nothing for ${agentType}`, () => {
    const root = pluginRoot()

    const result = run(root, ['SubagentStart'], { hook_event_name: 'SubagentStart', agent_type: agentType })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, '')
  })
}

test('takes the event from stdin when no argument is given', () => {
  const root = pluginRoot()

  const result = run(root, [], { hook_event_name: 'SubagentStart', agent_type: 'claude' })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.hookEventName, 'SubagentStart')
})

test('fails with a message on an unknown event', () => {
  const root = pluginRoot()

  const result = run(root, ['Stop'], { hook_event_name: 'Stop' })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Stop/)
  assert.equal(result.stdout, '')
})
