import { expect, test } from 'claude-code/testing'

const PANE_PROPS = {
  title: '🐀 Underlings',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: a spawned subagent draws a roster row and its detail`, async ($, on) => {
    on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'agent-1' }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.messages', () => ({ value: [] }))

    await $.agent.spawn({ prompt: 'Map the plugin API', description: 'Research the plugin API', subagentType: 'Explore' } as never)

    const pane = await $.ui.mount({
      plugin: 'under-empire', surface, component: 'Pane', requestId: 'underlings', props: PANE_PROPS,
    })
    expect(await pane.find({ text: /Grey Seer/ })).toBeDefined()
    expect(await pane.find({ text: /SUBAGENTS · 1/ })).toBeDefined()

    await pane.pointer({ type: 'down', x: 70, y: 2, button: 'left', in: 'hit-agent-1' })
    expect(await pane.find({ text: /TRANSCRIPT/ })).toBeDefined()
    expect(await pane.find({ text: /TOKENS/ })).toBeDefined()
  })
}

test('desktop: a subagent that completes moves from Subagents to Finished', async ($, on) => {
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'agent-2' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('tool.call', () => ({ result: { agentId: 'agent-2', status: 'completed', totalTokens: 1200 } }) as never)

  await $.agent.spawn({ prompt: 'Spike it', description: 'Spike the sprite renderer', subagentType: 'general-purpose' } as never)
  const pane = await $.ui.mount({
    plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS,
  })
  expect(await pane.find({ text: /SUBAGENTS · 1/ })).toBeDefined()

  await $.tool.call({ tool: 'Agent', prompt: 'Spike it', description: 'Spike the sprite renderer' } as never)
  expect(await pane.find({ text: /FINISHED · 1/ })).toBeDefined()
  expect(await pane.find({ text: /SUBAGENTS/ })).toBeUndefined()

  await pane.press({ key: 'clear-finished' })
  expect(await pane.find({ text: /FINISHED/ })).toBeUndefined()
  expect(await pane.find({ text: /No underlings are digging/ })).toBeDefined()
})
