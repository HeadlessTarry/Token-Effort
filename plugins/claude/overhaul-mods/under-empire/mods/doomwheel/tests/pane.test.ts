import { expect, test } from 'claude-code/testing'

import { INGEST_NOISE_HALT, INGEST_ROUND_HALT, PR_CREATE_OUTPUT, PR_URL, REPO, scriptCommand } from './fixtures'

const PANE_PROPS = {
  title: '⚙ Doomwheel',
  isFocused: false,
  bodyColumns: 80,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}
const MOUNT = { plugin: 'under-empire', component: 'Pane', requestId: 'doomwheel', props: PANE_PROPS } as const

type Seen = { opened: string[]; statuses: Array<string | undefined>; toasts: string[]; notified: string[] }

/** Answers the engine's ui calls beneath the plugin, recording what Doomwheel asked for. */
function watchUi(on: Parameters<Parameters<typeof test>[1]>[1]): Seen {
  const seen: Seen = { opened: [], statuses: [], toasts: [], notified: [] }
  on('ui.open', (_, e) => {
    seen.opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.status', (_, e) => {
    seen.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', (_, e) => {
    seen.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.notify', (_, e) => {
    seen.notified.push(e.text)
    return { value: { isSent: true } } as never
  })
  return seen
}

/** Each Bash call answers with `stdout`; anything else answers as set_monitor does. */
function answerTools(on: Parameters<Parameters<typeof test>[1]>[1], stdout: () => string) {
  on('tool.call', (_, e) => ((e as { tool?: unknown }).tool === 'Bash'
    ? { result: { stdout: stdout(), stderr: '', interrupted: false } }
    : { result: [{ type: 'text', text: `Auto-fix is on for ${REPO}#42.` }] }) as never)
}

test('without the skill, gh pr create and arming Auto-fix show nothing: no pane, status line, toast or card', async ($, on) => {
  const seen = watchUi(on)
  answerTools(on, () => PR_CREATE_OUTPUT)

  await $.tool.call({ tool: 'Bash', command: 'gh pr create --draft --title "Add warp-cannon"', description: 'Raise PR' } as never)
  await $.tool.call({ tool: 'mcp__ccd_pr__set_monitor', auto_fix: true, address_comments: true, url: PR_URL } as never)

  expect(seen.opened).toEqual([])
  expect(seen.statuses.filter(text => text !== undefined)).toEqual([])
  expect(seen.toasts).toEqual([])
  expect(seen.notified).toEqual([])
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /The Doomwheel stands idle/ })).toBeDefined()
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the skill's first ingest opens the pane on the wheel, with what came before it`, async ($, on) => {
    const seen = watchUi(on)
    let stdout = PR_CREATE_OUTPUT
    answerTools(on, () => stdout)

    await $.tool.call({ tool: 'Bash', command: 'gh pr create --draft --title "Add warp-cannon"', description: 'Raise PR' } as never)
    await $.tool.call({ tool: 'mcp__ccd_pr__set_monitor', auto_fix: true, address_comments: true, url: PR_URL } as never)
    stdout = JSON.stringify({
      action: 'handle', instruction: null, noise_count: 1, noise_limit: 3, round_count: 2, round_limit: 10,
      rounds: [{ kind: 'noise', findings: [{ severity: 'Low' }] }],
    })
    await $.tool.call({ tool: 'Bash', command: scriptCommand('ingest'), description: 'Ingest reviews' } as never)

    expect(seen.opened).toEqual(['doomwheel'])
    expect(seen.statuses.at(-1)).toBe('⚙ Doomwheel #42 · Spinning · heat ▰▱▱ · round 2/10')
    const pane = await $.ui.mount({ ...MOUNT, surface })
    expect(await pane.find({ text: /Offering #42 · clan-skryre\/warp-engine/ })).toBeDefined()
    expect(await pane.find({ text: /Spinning/ })).toBeDefined()
    expect(await pane.find({ text: /An offering is laid before the Council/ })).toBeDefined()
    expect(await pane.find({ text: /The Doomwheel spins!/ })).toBeDefined()
    expect(await pane.find({ text: /Heat rises to 1\/3/ })).toBeDefined()
  })
}

test('desktop: a halting ingest overheats the wheel, notifies, and warns while Auto-fix is still on', async ($, on) => {
  const seen = watchUi(on)
  answerTools(on, () => JSON.stringify(INGEST_NOISE_HALT))

  await $.tool.call({ tool: 'Bash', command: scriptCommand('ingest') } as never)
  expect(seen.notified).toEqual(['🔥 Doomwheel overheated on #42: Noise limit (3 noise rounds) reached. Your decision is needed.'])
  expect(seen.toasts).toEqual(seen.notified)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /Overheated/ })).toBeDefined()
  expect(await pane.find({ text: /still on — the wheel must be cut/ })).toBeDefined()
  expect(await pane.find({ text: /OVERHEAT! Noise limit/ })).toBeDefined()
})

test('desktop: a round-cap halt shows the wheel exhausted, not overheated, with a full rounds gauge', async ($, on) => {
  watchUi(on)
  answerTools(on, () => JSON.stringify(INGEST_ROUND_HALT))

  await $.tool.call({ tool: 'Bash', command: scriptCommand('ingest') } as never)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /^Exhausted$/ })).toBeDefined()
  expect(await pane.find({ text: /Overheated/ })).toBeUndefined()
  expect(await pane.find({ text: /^▰▰▰▰▰$/ })).toBeDefined()
  expect(await pane.find({ text: /^10\/10$/ })).toBeDefined()
  expect(await pane.find({ text: /EXHAUSTED! Round limit/ })).toBeDefined()
})

test('/doomwheel opens the pane', async ($, on) => {
  const seen = watchUi(on)
  const ran = await $.command.run({ command: 'doomwheel', args: '' } as never)
  expect(seen.opened).toEqual(['doomwheel'])
  expect((ran as { text?: string }).text).toBe('Doomwheel pane opened.')
})

test('desktop: event-shaped text in a tool result does not wake the wheel', async ($, on) => {
  watchUi(on)
  await $.session.append({
    door: 'tool-result',
    message: { role: 'user', content: [{ type: 'text', text: `<ci-monitor-event> is watching ${REPO} PR #7 and reports 1 CI check failed` }] },
  } as never).catch(() => undefined)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /The Doomwheel stands idle/ })).toBeDefined()
})
