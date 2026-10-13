import { expect, mock, test } from 'claude-code/testing'

const PANE_PROPS = {
  title: '🐀 Underlings',
  isFocused: false,
  bodyColumns: 90,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

const BIG_FILE = 5 * 1024 * 1024

const CASES = [
  { os: 'Linux', path: '/tmp/claude/proj/tasks/bg-big.output', tool: 'tail' },
  { os: 'Windows', path: 'D:\\Temp\\claude\\proj\\tasks\\bg-big.output', tool: 'powershell' },
] as const

for (const { os, path, tool } of CASES) {
  test(`${os}: output past 4 MiB is tailed with ${tool} and shows in the task's row`, async ($, on) => {
    const clock = mock.clock(on)
    const ran: string[][] = []
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('ui.scroll', () => ({ value: {} }) as never)
    on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'bg-big' } }) as never)
    on('fs.stat', () => ({ value: { kind: 'file', size: BIG_FILE, mtimeMs: 0, isSymlink: false } }) as never)
    on('process.run', (_$, e) => {
      ran.push([...e.argv])
      return { value: { exitCode: 0, stdout: 'shaft 179 dug\nshaft 180 dug\n[exited with code 0]\n', stderr: '' } } as never
    })

    await $.tool.call({ tool: 'Bash', tool_use_id: 'tu-big', command: 'dig --deep', description: 'Dig the deep shaft', run_in_background: true } as never)
    await $.session.append({
      message: {
        type: 'user', role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'tu-big', content: `Output is being written to: ${path}. You will be notified.` }],
      },
      door: 'tool-result', origin: { kind: 'tool', tool: 'Bash' }, uuid: 'row-big',
    } as never)
    await clock.advance(1_000)

    expect(ran[0]?.[0]).toBe(tool)
    expect(ran[0]?.at(-1)).toContain(tool === 'tail' ? path : 'Get-Content')

    const pane = await $.ui.mount({ plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS })
    expect(await pane.find({ text: /FINISHED · 1/ })).toBeDefined()
    await pane.pointer({ type: 'down', x: 3, y: 0, button: 'left', in: 'hit-bg-big' })
    expect(await pane.find({ text: /shaft 180 dug/ })).toBeDefined()
  })
}
