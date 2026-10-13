import { expect, test } from 'claude-code/testing'

const PANE_PROPS = {
  title: '🐀 Underlings',
  isFocused: false,
  bodyColumns: 90,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: a background Bash call becomes a roster row, and clicking it opens the detail`, async ($, on) => {
    on('tool.call', () => ({
      result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'bg1' },
    }) as never)

    await $.tool.call({
      tool: 'Bash',
      command: 'python -m pytest scripts/drift-detection/tests',
      description: 'Drift-detection test suite',
      run_in_background: true,
    } as never)

    const pane = await $.ui.mount({
      plugin: 'under-empire', surface, component: 'Pane', requestId: 'underlings', props: PANE_PROPS,
    })

    expect(await pane.find({ text: /1 underlings digging/ })).toBeDefined()
    expect(await pane.find({ key: 'hit-bg1' })).toBeDefined()
    expect(await pane.find({ text: /Eshin Inspector/ })).toBeDefined()
    expect(await pane.find({ text: /BACKGROUND TASKS · 1/ })).toBeDefined()

    await pane.pointer({ type: 'down', x: 3, y: 0, button: 'left', in: 'hit-bg1' })
    expect(await pane.find({ text: /read from file every 0.5s/i })).toBeDefined()
    expect(await pane.find({ text: /python -m pytest/ })).toBeDefined()

    await pane.press({ key: 'close-detail' })
    expect(await pane.find({ text: /read from file every 0.5s/i })).toBeUndefined()
  })
}

test('desktop: clicking a roster row on its avatar, not its title, selects it', async ($, on) => {
  on('tool.call', () => ({
    result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'bg2' },
  }) as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run build', description: 'Build the pane', run_in_background: true } as never)

  const pane = await $.ui.mount({
    plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS,
  })
  expect(await pane.find({ text: /LINES OUT/ })).toBeUndefined()

  await pane.pointer({ type: 'down', x: 2, y: 1, button: 'left', in: 'hit-bg2' })
  expect(await pane.find({ text: /LINES OUT/ })).toBeDefined()
  expect(await pane.find({ key: 'stop-detail' })).toBeDefined()
})

test('desktop: the pane says when nothing is digging', async $ => {
  const pane = await $.ui.mount({
    plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS,
  })
  expect(await pane.find({ text: /No underlings are digging/ })).toBeDefined()
})
