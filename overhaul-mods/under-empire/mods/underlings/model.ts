import type { Kind, TxEntry } from '../../types'

export const ROLES: Record<Kind, { role: string; color: string }> = {
  research: { role: 'Grey Seer', color: '#b07cff' },
  experiment: { role: 'Apprentice', color: '#7dff5a' },
  build: { role: 'Tunnel-Sapper', color: '#ff8a3d' },
  test: { role: 'Eshin Inspector', color: '#86b9ff' },
  other: { role: 'Clanrat', color: '#b3a594' },
}

const KIND_PATTERNS: ReadonlyArray<[Kind, RegExp]> = [
  ['test', /\b(test|tests|pytest|vitest|jest|lint|sonar|scan|review|audit|checks?|verify)\b/],
  ['experiment', /\b(spike|prototype|experiment|poc|benchmark|try)\b/],
  ['research', /\b(research|explore|investigate|map|search|find|analy[sz]e|plan)\b/],
  ['build', /\b(build|implement|write|refactor|fix|compile|tsc|scaffold)\b/],
]

export function classify(...texts: ReadonlyArray<string | undefined>): Kind {
  const haystack = texts.filter(Boolean).join(' ').toLowerCase()
  return KIND_PATTERNS.find(([, pattern]) => pattern.test(haystack))?.[0] ?? 'other'
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total / 60) % 60
  const seconds = String(total % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`
}

export function formatTokens(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return String(n)
}

export function shortModel(model: string | undefined): string {
  if (!model) return '—'
  return model.replace(/^claude-/, '').replace(/-(\d+)-(\d+)(-\d{8})?$/, ' $1.$2')
}

export function usageTotal(usage: {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
} | null | undefined): number {
  if (!usage) return 0
  return usage.input_tokens + usage.output_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens
}

const OUTPUT_PATH = /Output is being written to: (.+?\.output)(?=\.?\s|\.?$)/
const EXIT_MARKER = /\[exited with code (-?\d+)\]\s*$/
const KILLED_MARKER = /\[killed\]\s*$/
const NOTIFICATION_ID = /<task-id>([^<]+)<\/task-id>/
const NOTIFICATION_STATUS = /<status>([^<]+)<\/status>/
const NOTIFICATION_EXIT = /exit code (-?\d+)/
const WINDOWS_PATH = /^[A-Za-z]:[\\/]|^\\\\/

export function parseOutputPath(text: string): string | undefined {
  return OUTPUT_PATH.exec(text)?.[1]
}

export function parseExitMarker(text: string): number | undefined {
  const match = EXIT_MARKER.exec(text)
  return match ? Number(match[1]) : undefined
}

/** A stopped task's output file ends with `[killed]` in place of an exit code. */
export function isKilled(text: string): boolean {
  return KILLED_MARKER.test(text)
}

/**
 * The command that prints a file's last lines on the OS the path belongs to: PowerShell's
 * `Get-Content -Tail` for a Windows path (drive letter or UNC share), `tail` otherwise.
 */
export function tailCommand(path: string, lines: number): string[] {
  if (!WINDOWS_PATH.test(path)) return ['tail', '-n', String(lines), path]
  const quoted = path.replace(/'/g, "''")
  return ['powershell', '-NoProfile', '-Command', `Get-Content -LiteralPath '${quoted}' -Tail ${lines}`]
}

export type TaskNotification = { taskId: string; status: string; exitCode?: number }

export function parseTaskNotification(text: string): TaskNotification | undefined {
  const taskId = NOTIFICATION_ID.exec(text)?.[1]
  const status = NOTIFICATION_STATUS.exec(text)?.[1]
  if (!taskId || !status) return undefined
  const exit = NOTIFICATION_EXIT.exec(text)?.[1]
  return { taskId, status, exitCode: exit === undefined ? undefined : Number(exit) }
}

const ANSI_CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g
const ANSI_OSC = /\u001b\][^\u0007\u001b]*(\u0007|\u001b\\)/g
const OTHER_ESCAPE = /\u001b[@-_]?/g
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g

/**
 * Terminal output and model text made drawable: the surfaces refuse a `Code` (and so the whole
 * tree) that holds a control character, so colour codes go, carriage returns become line breaks,
 * tabs become spaces, and any other control character is dropped. Line breaks are kept.
 */
export function sanitize(text: string): string {
  return text
    .replace(ANSI_OSC, '')
    .replace(ANSI_CSI, '')
    .replace(OTHER_ESCAPE, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .replace(CONTROL, '')
}

export function tailLines(text: string, count: number): string {
  if (count <= 0) return ''
  const lines = text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')
  return lines.slice(-count).join('\n')
}

const ARG_FIELDS = ['command', 'file_path', 'pattern', 'url', 'query', 'description', 'path', 'prompt']

export function summarizeToolInput(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const record = input as Record<string, unknown>
  const field = ARG_FIELDS.find(name => typeof record[name] === 'string')
  const value = field ? String(record[field]) : Object.values(record).find(v => typeof v === 'string')
  return typeof value === 'string' ? sanitize(value).replace(/\s+/g, ' ').slice(0, 160) : ''
}

export function summarizeJson(json: string): string {
  try {
    return summarizeToolInput(JSON.parse(json))
  } catch {
    return ''
  }
}

export function summarizeResult(result: unknown, isError: boolean): string {
  if (isError) return 'error'
  if (typeof result === 'string') return firstLine(result)
  if (result && typeof result === 'object') {
    const record = result as Record<string, unknown>
    if (typeof record.stdout === 'string') return firstLine(record.stdout) || 'done'
    if (typeof record.numFiles === 'number') return `${record.numFiles} files`
    if (typeof record.numLines === 'number') return `${record.numLines} lines`
  }
  return 'done'
}

function firstLine(text: string): string {
  return sanitize(text).trim().split('\n')[0]?.slice(0, 120) ?? ''
}

export const TRANSCRIPT_LIMIT = 300

export function appendText(entries: TxEntry[], kind: 'text' | 'thinking', text: string): TxEntry[] {
  const last = entries.at(-1)
  if (last && last.kind === kind) {
    return [...entries.slice(0, -1), { kind, text: last.text + text }]
  }
  return [...entries, { kind, text }].slice(-TRANSCRIPT_LIMIT)
}
