import { expect, test } from 'claude-code/testing'

const PANE_PROPS = {
  title: '🐀 Underlings',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
}

const FINISHED_COUNT = 7

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: a long Finished group shows five rows until Show all opens it`, async ($, on) => {
    let spawned = 0
    let completed = 0
    on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++spawned}` }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('tool.call', () => ({ result: { agentId: `agent-${++completed}`, status: 'completed', totalTokens: 1200 } }) as never)

    for (let n = 1; n <= FINISHED_COUNT; n++) {
      await $.agent.spawn({ prompt: 'Dig', description: `Dig tunnel ${n}`, subagentType: 'general-purpose' } as never)
      await $.tool.call({ tool: 'Agent', prompt: 'Dig', description: `Dig tunnel ${n}` } as never)
    }
    const pane = await $.ui.mount({ plugin: 'under-empire', surface, component: 'Pane', requestId: 'underlings', props: PANE_PROPS })

    expect(await pane.find({ text: /FINISHED · 7/ })).toBeDefined()
    expect(await pane.findAll({ text: /^Dig tunnel \d$/ })).toHaveLength(5)
    expect(await pane.find({ text: /\+ 2 more/ })).toBeDefined()

    await pane.press({ key: 'toggle-Finished' })
    expect(await pane.findAll({ text: /^Dig tunnel \d$/ })).toHaveLength(FINISHED_COUNT)
    expect(await pane.find({ text: /Show fewer/ })).toBeDefined()
  })
}

test('desktop: an opened detail unfolds under its own row, above the rows after it', async ($, on) => {
  let spawned = 0
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++spawned}` }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.scroll', () => ({ value: {} }) as never)
  on('session.messages', () => ({ value: [] }))

  await $.agent.spawn({ prompt: 'Dig', description: 'Dig the deep tunnel', subagentType: 'general-purpose' } as never)
  await $.agent.spawn({ prompt: 'Dig', description: 'Dig the shallow tunnel', subagentType: 'general-purpose' } as never)
  const pane = await $.ui.mount({ plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS })
  // Newest first: the shallow tunnel (agent-2) sits above the deep one (agent-1).
  await pane.pointer({ type: 'down', x: 70, y: 2, button: 'left', in: 'hit-agent-2' })

  const drawn = JSON.stringify(await pane.drawn())
  const rowAt = drawn.indexOf('Dig the shallow tunnel')
  const detailAt = drawn.indexOf('LIVE TRANSCRIPT')
  expect(drawn.indexOf('SUBAGENTS · 2')).toBeLessThan(rowAt)
  expect(rowAt).toBeLessThan(detailAt)
  expect(detailAt).toBeLessThan(drawn.indexOf('Dig the deep tunnel'))
})

test('desktop: a subagent whose spawn went unseen still gets a row from its Agent call', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('tool.call', () => ({ result: { agentId: 'agent-late', status: 'async_launched' } }) as never)

  await $.tool.call({ tool: 'Agent', prompt: 'Dig', description: 'Dig the lost tunnel', subagent_type: 'general-purpose', run_in_background: true } as never)
  const pane = await $.ui.mount({ plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS })
  expect(await pane.find({ text: /SUBAGENTS · 1/ })).toBeDefined()
  expect(await pane.find({ text: /Dig the lost tunnel/ })).toBeDefined()
})

test('desktop: under a 50-underling load the pane tree stays small enough to redraw every second', async ($, on) => {
  let bg = 0
  let ag = 0
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: `agent-${++ag}` }))
  on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: `bg${++bg}` } }) as never)
  for (let n = 1; n <= 42; n++) await $.tool.call({ tool: 'Bash', command: `loop ${n}`, description: `Dig test tunnel ${n}`, run_in_background: true } as never)
  for (let n = 1; n <= 8; n++) await $.agent.spawn({ prompt: 'p', description: `Test clanrat ${n}`, subagentType: 'general-purpose' } as never)
  const pane = await $.ui.mount({ plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS })

  expect(JSON.stringify(await pane.drawn()).length).toBeLessThan(60_000)
  await pane.press({ key: 'toggle-Background tasks' })
  expect(JSON.stringify(await pane.drawn()).length).toBeLessThan(250_000)
})
