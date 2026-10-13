import { describe, expect, test } from 'claude-code/testing'

import {
  appendText, classify, formatElapsed, formatTokens, parseExitMarker, parseOutputPath,
  isKilled, parseTaskNotification, sanitize, shortModel, summarizeJson, summarizeResult, tailCommands, tailLines, usageTotal,
} from '../model'

describe('classify', () => {
  test('maps task wording to a Skaven role', () => {
    expect(classify('Map every hook point in the plugin API', 'Explore')).toBe('research')
    expect(classify('Spike: canvas pixel-sprite renderer')).toBe('experiment')
    expect(classify('Implement side-pane plugin module')).toBe('build')
    expect(classify('Drift-detection test suite', 'python -m pytest scripts')).toBe('test')
    expect(classify('Tidy the desk')).toBe('other')
  })

  test('test wording wins over build wording', () => {
    expect(classify('Build and run the vitest suite')).toBe('test')
  })
})

describe('formatting', () => {
  test('formats elapsed time', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(252_000)).toBe('4:12')
    expect(formatElapsed(3_723_000)).toBe('1:02:03')
  })

  test('formats token counts', () => {
    expect(formatTokens(512)).toBe('512')
    expect(formatTokens(48_210)).toBe('48.2k')
    expect(formatTokens(2_500_000)).toBe('2.50M')
  })

  test('shortens model ids', () => {
    expect(shortModel('claude-haiku-5-5')).toBe('haiku 5.5')
    expect(shortModel('claude-opus-5-5-20260101')).toBe('opus 5.5')
    expect(shortModel(undefined)).toBe('—')
  })

  test('totals a step usage', () => {
    expect(usageTotal({ input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 1 })).toBe(116)
    expect(usageTotal(null)).toBe(0)
  })
})

describe('engine messages', () => {
  test('finds the output file in a background Bash result', () => {
    const text = 'Command running in background with ID: b07xha8h8. Output is being written to: /tmp/claude/proj/tasks/b07xha8h8.output. You will be notified when it completes.'
    expect(parseOutputPath(text)).toBe('/tmp/claude/proj/tasks/b07xha8h8.output')
    expect(parseOutputPath('no path here')).toBeUndefined()
    expect(parseOutputPath('Output is being written to: D:\\Users\\Jane Smith\\tasks\\b1.output. You will be notified.'))
      .toBe('D:\\Users\\Jane Smith\\tasks\\b1.output')
  })

  test('reads the exit marker at the end of an output file', () => {
    expect(parseExitMarker('tick 10\n\n[exited with code 0]\n')).toBe(0)
    expect(parseExitMarker('boom\n[exited with code 2]')).toBe(2)
    expect(parseExitMarker('still running')).toBeUndefined()
    expect(isKilled('digging shaft 40/180\n[killed]\n')).toBe(true)
    expect(isKilled('digging shaft 40/180')).toBe(false)
  })

  test('reads a task notification', () => {
    const text = '<task-notification>\n<task-id>b07xha8h8</task-id>\n<status>completed</status>\n<summary>Background command "x" completed (exit code 0)</summary>\n</task-notification>'
    expect(parseTaskNotification(text)).toEqual({ taskId: 'b07xha8h8', status: 'completed', exitCode: 0 })
    expect(parseTaskNotification('<task-id>a1</task-id>')).toBeUndefined()
  })

  test('sanitises terminal output so no control character reaches a drawing', () => {
    const raw = '\u001b[32m✓ passed\u001b[0m\r\nprogress 10%\rprogress 100%\n\tindented\u0007\u001b]0;title\u0007 done'
    const clean = sanitize(raw)
    expect(clean).toBe('✓ passed\nprogress 10%\nprogress 100%\n    indented done')
    expect(/[\u0000-\u0009\u000b-\u001f\u007f]/.test(clean)).toBe(false)
  })

  test('keeps the last lines of output', () => {
    expect(tailLines('a\r\nb\r\nc\r\n', 2)).toBe('b\nc')
    expect(tailLines('a\nb', 0)).toBe('')
  })
})

describe('tailCommands', () => {
  test('tails a POSIX path with tail, then PowerShell', () => {
    const [first, second] = tailCommands('/tmp/claude/tasks/b1.output', 400)
    expect(first).toEqual(['tail', '-n', '400', '/tmp/claude/tasks/b1.output'])
    expect(second?.[0]).toBe('powershell')
  })

  test('tails a Windows path with PowerShell, quoting the path, then tail', () => {
    const [first, second] = tailCommands("D:\\Temp\\O'Brien\\b1.output", 400)
    expect(first).toEqual([
      'powershell', '-NoProfile', '-Command', "Get-Content -LiteralPath 'D:\\Temp\\O''Brien\\b1.output' -Tail 400",
    ])
    expect(second?.[0]).toBe('tail')
    expect(tailCommands('D:/Temp/b1.output', 10)[0]?.[0]).toBe('powershell')
    expect(tailCommands('\\\\server\\share\\b1.output', 10)[0]?.[0]).toBe('powershell')
  })
})

describe('transcript building', () => {
  test('streamed pieces of one kind join into one entry', () => {
    let entries = appendText([], 'text', 'Hel')
    entries = appendText(entries, 'text', 'lo')
    entries = appendText(entries, 'thinking', 'hmm')
    expect(entries).toEqual([{ kind: 'text', text: 'Hello' }, { kind: 'thinking', text: 'hmm' }])
  })

  test('summarises tool arguments and results', () => {
    expect(summarizeJson('{"command":"npm test","description":"Run tests"}')).toBe('npm test')
    expect(summarizeJson('{"file_path":"src/a.ts"}')).toBe('src/a.ts')
    expect(summarizeJson('{"broken')).toBe('')
    expect(summarizeResult({ stdout: 'ok\nmore' }, false)).toBe('ok')
    expect(summarizeResult('anything', true)).toBe('error')
  })
})
