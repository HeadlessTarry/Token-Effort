import { expect, mock, test } from 'claude-code/testing'

const PANE_PROPS = {
  title: '🐀 Underlings',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
}

/** Each request resends the conversation so far, served mostly from the prompt cache. */
const REQUESTS = [
  { input_tokens: 2_000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 7_500 },
  { input_tokens: 1_000, output_tokens: 500, cache_read_input_tokens: 10_000, cache_creation_input_tokens: 8_500 },
  { input_tokens: 1_000, output_tokens: 500, cache_read_input_tokens: 20_000, cache_creation_input_tokens: 8_500 },
]

test('desktop: a subagent shows its latest context size, not the sum of every request', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'agent-3' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.messages', () => ({ value: [] }))
  on('turn.step', async function* (_$, e) {
    const usage = { ...REQUESTS[e.index], model: 'claude-haiku-5-5' }
    yield { kind: 'stop', stopReason: 'end_turn', usage } as never
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] } as never
  })

  await $.agent.spawn({ prompt: 'Dig', description: 'Dig the tunnel', subagentType: 'general-purpose' } as never)
  for (let index = 0; index < REQUESTS.length; index++) {
    const stream = $.turn.step({ turnId: 'turn-1', index, model: 'claude-haiku-5-5', messageCount: index + 1, agentId: 'agent-3' })
    for await (const _ of stream) { /* drain */ }
  }
  await clock.advance(1_000)

  const pane = await $.ui.mount({
    plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS,
  })
  expect(await pane.find({ text: /30\.0k tok/ })).toBeDefined()
  expect(await pane.find({ text: /60\.0k/ })).toBeUndefined()
})
