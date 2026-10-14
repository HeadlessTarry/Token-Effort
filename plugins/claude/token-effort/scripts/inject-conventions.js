#!/usr/bin/env node
// Usage: inject-conventions.js [SessionStart|SubagentStart] < hook-input.json
// Prints the core plugin's config/AGENTS.md as hook context, with $AI_CONFIG_DIR
// replaced by the installed config directory. The event comes from the argument,
// else from the hook input's hook_event_name.
//   SessionStart:  plain text on stdout.
//   SubagentStart: hookSpecificOutput.additionalContext JSON; nothing for agents in SKIPPED_AGENTS.
const fs = require('node:fs')
const path = require('node:path')

// Subagent types that never received ~/.claude/AGENTS.md, so they get no conventions either.
const SKIPPED_AGENTS = new Set(['Explore', 'Plan'])

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function conventions() {
  const root = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..', '..', '..')
  const config = path.join(root, 'config')
  return fs.readFileSync(path.join(config, 'AGENTS.md'), 'utf8').replaceAll('$AI_CONFIG_DIR', config)
}

function main(args) {
  const input = readInput()
  const event = args[0] || input.hook_event_name
  if (event === 'SessionStart') {
    process.stdout.write(conventions())
  } else if (event === 'SubagentStart') {
    if (SKIPPED_AGENTS.has(input.agent_type)) return 0
    const output = { hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: conventions() } }
    process.stdout.write(JSON.stringify(output) + '\n')
  } else {
    process.stderr.write(`inject-conventions: unsupported hook event: ${event}\n`)
    return 1
  }
  return 0
}

process.exitCode = main(process.argv.slice(2))
