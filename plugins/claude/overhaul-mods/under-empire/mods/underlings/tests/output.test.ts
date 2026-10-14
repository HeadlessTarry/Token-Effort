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

const LINUX_PATH = '/tmp/claude/proj/tasks/bg-big.output'
const WINDOWS_PATH = 'D:\\Temp\\claude\\proj\\tasks\\bg-big.output'

/** `tried` is every command run, in order; only `tool` exits 0. */
const CASES = [
  { name: 'Linux: tailed with tail', path: LINUX_PATH, tool: 'tail', tried: ['tail'] },
  { name: 'Windows: tailed with PowerShell', path: WINDOWS_PATH, tool: 'powershell', tried: ['powershell'] },
  { name: 'Windows without PowerShell: falls back to tail', path: WINDOWS_PATH, tool: 'tail', tried: ['powershell', 'tail'] },
] as const

for (const { name, path, tool, tried } of CASES) {
  test(`${name}, output past 4 MiB shows in the task's row`, async ($, on) => {
    const clock = mock.clock(on)
    const ran: string[][] = []
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('ui.scroll', () => ({ value: {} }) as never)
    on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'bg-big' } }) as never)
    on('fs.stat', () => ({ value: { kind: 'file', size: BIG_FILE, mtimeMs: 0, isSymlink: false } }) as never)
    on('process.run', (_$, e) => {
      ran.push([...e.argv])
      if (e.argv[0] !== tool) return { value: { exitCode: 127, stdout: '', stderr: 'not found' } } as never
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

    expect(ran.map(argv => argv[0])).toEqual([...tried])
    expect(ran.at(-1)?.at(-1)).toContain(tool === 'tail' ? path : 'Get-Content')

    const pane = await $.ui.mount({ plugin: 'under-empire', surface: 'desktop', component: 'Pane', requestId: 'underlings', props: PANE_PROPS })
    expect(await pane.find({ text: /FINISHED · 1/ })).toBeDefined()
    await pane.pointer({ type: 'down', x: 3, y: 0, button: 'left', in: 'hit-bg-big' })
    expect(await pane.find({ text: /shaft 180 dug/ })).toBeDefined()
  })
}
