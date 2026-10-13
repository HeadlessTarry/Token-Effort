import { atom, memberOf, read, update } from 'claude-code'
import type { ElementTable, EngineInterface as Engine, Register, RenderElement, SessionMessage, TurnStepChunk } from 'claude-code'

import type { Status, TxEntry, Underling } from '../../types'
import {
  ROLES, appendText, classify, formatElapsed, formatTokens, isKilled, parseExitMarker, parseOutputPath,
  parseTaskNotification, sanitize, shortModel, summarizeJson, summarizeResult, summarizeToolInput, tailCommand,
  tailLines, usageTotal, TRANSCRIPT_LIMIT,
} from './model'
import { FINISHED_GREY, spriteSvg } from './sprites'

const PANE = 'underlings'
const PANE_TITLE = '🐀 Underlings'
const FLUSH_MS = 500
const OUTPUT_LINES = 400
const MAX_READ_BYTES = 4 * 1024 * 1024
const ROW_ROWS = 3
/** Rows each roster group shows until its Show all toggle opens it. */
const GROUP_CAP = 5
/** Rows the detail panel takes besides its transcript or output: borders, header, stat cells and headings. */
const DETAIL_CHROME_ROWS = 19
/** Most rows a detail's transcript or output takes, so an open accordion never dwarfs the roster. */
const DETAIL_MAX_ROOM = 30
const AVATAR_COLUMNS = 6
const ROW_AVATAR_PX = 44
const DETAIL_AVATAR_PX = 72
const OK = '#5fbf5a'
const BAD = '#e0574a'
const STOPPED = '#d9a441'
const ACCENT = '#d97757'
const LINE = 'rgba(128,128,128,0.35)'
const HOVER_BG = 'rgba(128,128,128,0.10)'
const SUNK_BG = 'rgba(0,0,0,0.22)'
const EDGE_PX = 3
const EDGE_HEIGHT_PX = 240

// The plugin is under-empire; every key Underlings owns there starts `underlings.`.
const list = atom({ plugin: 'under-empire', key: 'underlings.list' } as const, [] as Underling[])
const selected = atom({ plugin: 'under-empire', key: 'underlings.selected' } as const, null as string | null)
const now = atom({ plugin: 'under-empire', key: 'underlings.now' } as const, 0)
const expanded = atom({ plugin: 'under-empire', key: 'underlings.expanded' } as const, [] as string[])

const transcriptFamily = atom({ plugin: 'under-empire', key: 'underlings.transcript' } as const, [] as TxEntry[])
const outputFamily = atom({ plugin: 'under-empire', key: 'underlings.output' } as const, '')

// Working copies held between flushes; $.state stays the source of truth across reloads.
const transcripts = new Map<string, TxEntry[]>()
const dirtyTranscripts = new Set<string>()
const toolInputs = new Map<string, string>()
/** Each subagent's context size at its latest model request, awaiting the next flush. */
const pendingTokens = new Map<string, number>()
const followedSizes = new Map<string, number>()
let isTicking = false
let rotation = 0
const outputPaths = new Map<string, string>()
const tickers: Array<{ cancel: () => void }> = []

// ---------------------------------------------------------------- tracker

async function addUnderling($: Engine, item: Underling) {
  let isFirst = false
  await update($, list, items => {
    if (items.some(one => one.id === item.id)) return items
    isFirst = !items.some(one => one.status === 'running')
    return [...items, item]
  })
  if (isFirst) await $.ui.open({ id: PANE, title: PANE_TITLE })
}

async function patchUnderling($: Engine, id: string, patch: Partial<Underling>) {
  await update($, list, items => items.map(one => (one.id === id ? { ...one, ...patch } : one)))
}

async function finishUnderling($: Engine, id: string, status: Status, exitCode?: number) {
  const items = await read($, list)
  const item = items.find(one => one.id === id)
  if (!item || item.status !== 'running') return
  await patchUnderling($, id, { status, endedAt: Date.now(), exitCode: exitCode ?? item.exitCode })
  if (item.type === 'bash') {
    await pollOutput($, id)
    followedSizes.delete(id)
  }
}

// ---------------------------------------------------------------- subagent transcripts

async function loadTranscript($: Engine, id: string): Promise<TxEntry[]> {
  const held = transcripts.get(id)
  if (held) return held
  const stored = await read($, memberOf(transcriptFamily, { requestId: id }))
  transcripts.set(id, stored)
  return stored
}

function setTranscript(id: string, entries: TxEntry[]) {
  transcripts.set(id, entries.slice(-TRANSCRIPT_LIMIT))
  dirtyTranscripts.add(id)
}

async function onChunk($: Engine, agentId: string, chunk: TurnStepChunk) {
  const entries = await loadTranscript($, agentId)
  if (chunk.kind === 'text' || chunk.kind === 'thinking') {
    setTranscript(agentId, appendText(entries, chunk.kind, sanitize(chunk.text)))
  } else if (chunk.kind === 'tool') {
    toolInputs.set(chunk.id, '')
    setTranscript(agentId, [...entries, { kind: 'tool', id: chunk.id, name: chunk.name, arg: '' }])
  } else if (chunk.kind === 'input') {
    const call = [...entries].reverse().find(one => one.kind === 'tool')
    if (call?.kind === 'tool') toolInputs.set(call.id, (toolInputs.get(call.id) ?? '') + chunk.json)
  } else if (chunk.kind === 'stop') {
    setTranscript(agentId, entries.map(one => (
      one.kind === 'tool' && !one.arg && toolInputs.has(one.id)
        ? { ...one, arg: summarizeJson(toolInputs.get(one.id) ?? '') }
        : one
    )))
    const total = usageTotal(chunk.usage)
    if (total > 0) pendingTokens.set(agentId, total)
  }
}

async function onToolResult($: Engine, agentId: string, toolUseId: string, result: unknown, isError: boolean) {
  const entries = await loadTranscript($, agentId)
  if (!entries.some(one => one.kind === 'tool' && one.id === toolUseId)) return
  toolInputs.delete(toolUseId)
  setTranscript(agentId, entries.map(one => (
    one.kind === 'tool' && one.id === toolUseId ? { ...one, result: summarizeResult(result, isError), isError } : one
  )))
}

async function backfillTranscript($: Engine, id: string) {
  const held = await loadTranscript($, id)
  if (held.length > 0) return
  const answer = await $.session.messages({ agentId: id })
  if (!Array.isArray(answer)) return
  const rows = answer as SessionMessage[]
  const entries: TxEntry[] = []
  for (const row of rows) {
    if (row.role === 'assistant' && row.text) entries.push({ kind: 'text', text: sanitize(row.text) })
    for (const use of row.toolUses) {
      const outcome = row.toolResults?.find(r => r.tool_use_id === use.tool_use_id)
      entries.push({
        kind: 'tool', id: use.tool_use_id, name: use.tool, arg: summarizeToolInput(use.input),
        result: outcome ? summarizeResult(outcome.text, outcome.isError) : 'done', isError: outcome?.isError,
      })
    }
  }
  setTranscript(id, entries)
  await flush($)
}

async function flush($: Engine) {
  for (const id of [...dirtyTranscripts]) {
    dirtyTranscripts.delete(id)
    const entries = transcripts.get(id) ?? []
    await update($, memberOf(transcriptFamily, { requestId: id }), () => entries)
  }
  if (pendingTokens.size > 0) {
    const latest = new Map(pendingTokens)
    pendingTokens.clear()
    await update($, list, items => items.map(one => (
      latest.has(one.id) ? { ...one, tokens: latest.get(one.id) } : one
    )))
  }
}

/** Starts the flush timer once per module load; /reload-plugins may not raise session.start again. */
async function ensureTicker($: Engine) {
  if (tickers.length > 0) return
  tickers.push($.clock.every(FLUSH_MS, () => tick($)))
}

async function tick($: Engine) {
  // A tick still running when the next comes due is left to finish; ticks never queue behind each other.
  if (isTicking) return
  isTicking = true
  try {
    await flush($)
    const items = await read($, list)
    if (!items.some(one => one.status === 'running')) return
    await pollRound($, items)
    await advanceClock($)
  } finally {
    isTicking = false
  }
}

async function advanceClock($: Engine) {
  // Elapsed times show whole seconds, so the pane redraws once a second, not on every tick.
  const second = Math.floor(Date.now() / 1000) * 1000
  if ((await read($, now)) !== second) await update($, now, () => second)
}

/**
 * Reads at most two output files a tick, however many tasks run: the open task's, and one other
 * running task's in turn. Task notifications finish most tasks; the rotation catches any whose
 * notification never came.
 */
async function pollRound($: Engine, items: Underling[]) {
  const chosenId = await read($, selected)
  const chosen = items.find(one => one.id === chosenId && one.type === 'bash')
  if (chosen) await pollOutput($, chosen.id)
  const others = items.filter(one => one.type === 'bash' && one.status === 'running' && one.id !== chosenId)
  if (others.length === 0) return
  rotation = (rotation + 1) % others.length
  const next = others[rotation]
  if (next) await pollOutput($, next.id)
}

// ---------------------------------------------------------------- background output

async function readTail($: Engine, path: string, size: number): Promise<string> {
  if (size <= MAX_READ_BYTES) return tailLines(sanitize(await $.fs.read(path)), OUTPUT_LINES)
  // $.fs.read refuses files past 4 MiB, so a host command reads the tail.
  const ran = await $.process.run(tailCommand(path, OUTPUT_LINES))
  return sanitize(ran.stdout)
}

async function pollOutput($: Engine, id: string) {
  const path = outputPaths.get(id) ?? (await read($, list)).find(one => one.id === id)?.outputPath
  if (!path) return
  try {
    const { size } = await $.fs.stat(path)
    if (size === followedSizes.get(id)) return
    followedSizes.set(id, size)
    const text = await readTail($, path, size)
    await update($, memberOf(outputFamily, { requestId: id }), () => text)
    const exitCode = parseExitMarker(text)
    if (exitCode !== undefined) await finishUnderling($, id, exitCode === 0 ? 'done' : 'failed', exitCode)
    else if (isKilled(text)) await finishUnderling($, id, 'stopped')
  } catch {
    // The file appears a moment after the task starts; the next poll tries again.
  }
}

// ---------------------------------------------------------------- tool calls and rows

async function afterToolCall($: Engine, e: { tool: string; tool_use_id: string; agentId?: string } & Record<string, unknown>, ran: unknown) {
  const answer = ran as { deny?: string; result?: Record<string, unknown>; isError?: boolean }
  if (e.agentId) {
    await onToolResult($, e.agentId, e.tool_use_id, answer.deny ?? answer.result, Boolean(answer.deny) || answer.isError === true)
  }
  if (answer.deny || !answer.result) return
  if (e.tool === 'Bash' && typeof answer.result.backgroundTaskId === 'string') {
    const id = answer.result.backgroundTaskId
    const command = sanitize(String(e.command ?? ''))
    const description = typeof e.description === 'string' ? e.description : undefined
    await addUnderling($, {
      id, type: 'bash', title: description ?? command.slice(0, 80), kind: classify(description, command),
      status: 'running', startedAt: Date.now(), toolUseId: e.tool_use_id, command,
    })
    const path = outputPaths.get(e.tool_use_id)
    if (path) await patchUnderling($, id, { outputPath: path })
  }
  if (e.tool === 'Agent') {
    const result = answer.result
    const agentId = typeof result.agentId === 'string' ? result.agentId : undefined
    if (!agentId) return
    const model = typeof result.resolvedModel === 'string' ? result.resolvedModel : undefined
    // agent.spawn adds the row; this catches a subagent whose spawn hook was passed over.
    const description = typeof e.description === 'string' ? e.description : undefined
    const agentType = typeof e.subagent_type === 'string' ? e.subagent_type : undefined
    await addUnderling($, {
      id: agentId, type: 'subagent', title: sanitize(description || agentType || 'Subagent'),
      kind: classify(description, agentType), status: 'running', startedAt: Date.now(),
      toolUseId: e.tool_use_id, agentType, model, tokens: 0,
    })
    if (model) await patchUnderling($, agentId, { model })
    if (result.status === 'completed') {
      if (typeof result.totalTokens === 'number') await patchUnderling($, agentId, { tokens: result.totalTokens })
      await finishUnderling($, agentId, 'done')
    }
  }
}

function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map(block => contentText((block as { text?: unknown; content?: unknown }).text ?? (block as { content?: unknown }).content)).join('\n')
  return ''
}

async function onRow($: Engine, door: string, blocks: ReadonlyArray<Record<string, unknown>>) {
  if (door === 'tool-result') {
    for (const block of blocks) {
      if (block.type !== 'tool_result' || typeof block.tool_use_id !== 'string') continue
      const path = parseOutputPath(contentText(block.content))
      if (!path) continue
      outputPaths.set(block.tool_use_id, path)
      const items = await read($, list)
      const task = items.find(one => one.toolUseId === block.tool_use_id && one.type === 'bash')
      if (task) await patchUnderling($, task.id, { outputPath: path })
    }
    return
  }
  const notice = parseTaskNotification(blocks.map(block => contentText(block.text ?? block.content)).join('\n'))
  if (notice) {
    await finishUnderling($, notice.taskId, noticeStatus(notice.status, notice.exitCode), notice.exitCode)
  }
}

async function select($: Engine, id: string) {
  const current = await read($, selected)
  await update($, selected, () => (current === id ? null : id))
  if (current !== id) await $.ui.scroll({ to: { key: `detail-${id}` }, in: PANE, block: 'nearest' }).catch(() => undefined)
  const item = (await read($, list)).find(one => one.id === id)
  if (current !== id && item?.type === 'subagent') await backfillTranscript($, id)
}

async function toggleGroup($: Engine, label: string) {
  await update($, expanded, open => (open.includes(label) ? open.filter(one => one !== label) : [...open, label]))
}

async function clearFinished($: Engine) {
  const items = await read($, list)
  const kept = items.filter(one => one.status === 'running')
  await update($, list, () => kept)
  const current = await read($, selected)
  if (current && !kept.some(one => one.id === current)) await update($, selected, () => null)
}

async function stopUnderling($: Engine, id: string) {
  const ran = await $.tool.call({ tool: 'TaskStop', task_id: id } as never).catch((err: unknown) => ({ deny: String(err) }))
  const answer = ran as { deny?: string; isError?: boolean; text?: string; result?: unknown }
  if (!answer.deny && !answer.isError) {
    await finishUnderling($, id, 'stopped')
    return
  }
  const detail = answer.deny ?? answer.text ?? (typeof answer.result === 'string' ? answer.result : JSON.stringify(answer.result ?? null))
  // The engine no longer knows the task: it ended without a marker or notice we could read.
  if (detail.includes('No task found')) {
    await finishUnderling($, id, 'stopped')
    return
  }
  $.ui.toast(`Could not stop ${id}: ${sanitize(detail).slice(0, 300)}`)
}

// ---------------------------------------------------------------- drawing helpers (no $)

function noticeStatus(status: string, exitCode: number | undefined): Status {
  if (status === 'killed' || status === 'stopped') return 'stopped'
  return status === 'completed' && (exitCode === undefined || exitCode === 0) ? 'done' : 'failed'
}

function turnStatus(reason: string): Status {
  if (reason === 'answer') return 'done'
  return reason === 'aborted' ? 'stopped' : 'failed'
}

function statusMark(status: Status): { glyph: string; color: string } {
  if (status === 'done') return { glyph: '✓', color: OK }
  if (status === 'failed') return { glyph: '✕', color: BAD }
  if (status === 'stopped') return { glyph: '■', color: STOPPED }
  return { glyph: '●', color: ACCENT }
}

/** `#rrggbb` plus an alpha byte: a tint that sits on either theme's background. */
function tint(color: string, alpha: number): string {
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
}

/** A solid bar taller than any row; the row's edge Box clips it to the row's own height. */
function edgeSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${EDGE_PX}" height="${EDGE_HEIGHT_PX}"><rect width="${EDGE_PX}" height="${EDGE_HEIGHT_PX}" fill="${color}"/></svg>`
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`
}

function entryLines(entry: TxEntry, width: number): number {
  if (entry.kind === 'tool') return entry.result ? 2 : 1
  return Math.max(1, Math.ceil(entry.text.length / Math.max(20, width)))
}

function fitTranscript(entries: TxEntry[], rows: number, width: number): TxEntry[] {
  const shown: TxEntry[] = []
  let used = 0
  for (let i = entries.length - 1; i >= 0 && used < rows; i--) {
    const entry = entries[i]
    if (!entry) continue
    used += entryLines(entry, width)
    shown.unshift(entry)
  }
  return shown
}

// ---------------------------------------------------------------- hooks

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'underlings', description: 'Show the Underlings pane: running subagents and background tasks' })
    await ensureTicker($)
    return started
  })

  on('command.run', { command: 'underlings' }, async $ => {
    await ensureTicker($)
    await tick($)
    await $.ui.open({ id: PANE, title: PANE_TITLE })
    return { text: 'Underlings pane opened.' }
  })

  on('agent.spawn', async ($, e, next) => {
    await ensureTicker($)
    const spawned = await next(e)
    if (spawned.deny === undefined && spawned.agentId) {
      await addUnderling($, {
        id: spawned.agentId, type: 'subagent', title: sanitize(e.description || e.subagentType),
        kind: classify(e.description, e.subagentType), status: 'running', startedAt: Date.now(),
        toolUseId: e.tool_use_id, agentType: e.subagentType, model: spawned.model, tokens: 0,
      })
    }
    return spawned
  }).catch(($, e, next) => next(e))

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) return yield* next(e)
    const stream = next(e)
    for await (const chunk of stream) {
      await onChunk($, e.agentId, chunk)
      yield chunk
    }
    return stream.result
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) await finishUnderling($, e.agentId, turnStatus(e.reason))
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    await ensureTicker($).catch(() => undefined)
    const ran = await next(e)
    await afterToolCall($, e as never, ran).catch(() => undefined)
    return ran
  }).catch(($, e, next) => next(e))

  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    if (!e.agentId) await onRow($, e.door, e.message.content).catch(() => undefined)
    return stored
  }).catch(($, e, next) => next(e))

  on('ui.message', { requestId: PANE }, async ($, e, next) => {
    const pick = (e.data as { pick?: unknown } | null)?.pick
    if (typeof pick === 'string') await select($, pick)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button, Code } = ui
    const Svg = e.surface === 'terminal' ? undefined : (ui as ElementTable<'desktop'>).Svg
    const Client = e.surface === 'terminal' || e.surface === 'desktop' ? (ui as ElementTable<'desktop'>).Client : undefined
    const items = await read($, list)
    const chosenId = await read($, selected)
    const openGroups = await read($, expanded)
    const clock = (await read($, now)) || Date.now()
    const columns = e.props.bodyColumns
    const bodyRows = e.props.scroll?.bodyRows ?? 40
    const running = items.filter(one => one.status === 'running')
    const totalTokens = items.reduce((sum, one) => sum + (one.tokens ?? 0), 0)

    // Animated sprites are ~4x the size of a still frame and the pane redraws every second while
    // anything runs, so only the open detail's rat animates; roster rats hold their first frame.
    const avatar = (item: Underling, px: number, animate: boolean) => (Svg
      ? <Svg source={spriteSvg(item.kind, item.status, px, animate)} alt={ROLES[item.kind].role} width={px} height={px} />
      : <Text color={ROLES[item.kind].color}>{item.status === 'running' ? '🐀' : statusMark(item.status).glyph}</Text>)

    if (items.length === 0) {
      return <Box flexDirection="column" paddingX={1}><Text dimColor>No underlings are digging.</Text></Box>
    }

    const newestFirst = (a: Underling, b: Underling) => b.startedAt - a.startedAt
    const subagents = running.filter(one => one.type === 'subagent').sort(newestFirst)
    const shells = running.filter(one => one.type === 'bash').sort(newestFirst)
    const finished = items.filter(one => one.status !== 'running')
      .sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt))
    const chosen = items.find(one => one.id === chosenId)
    const infoColumns = Math.max(12, columns - AVATAR_COLUMNS - 3)

    const row = (item: Underling) => {
      const role = ROLES[item.kind]
      const mark = statusMark(item.status)
      const isChosen = item.id === chosenId
      // Once finished, only the ✓ / ✕ mark keeps its colour; the role and selection turn grey.
      const rowColor = item.status === 'running' ? role.color : FINISHED_GREY
      const elapsed = formatElapsed((item.endedAt ?? clock) - item.startedAt)
      const meta = item.type === 'subagent'
        ? `${shortModel(item.model)} · ${formatTokens(item.tokens ?? 0)} tok`
        : item.command ?? ''
      const title = truncate(item.title, Math.max(4, infoColumns - elapsed.length - 2))
      return (
        <Box key={`row-${item.id}`} position="relative" flexDirection="row" height={ROW_ROWS} overflow="hidden"
          backgroundColor={isChosen ? tint(rowColor, 0.12) : undefined}>
          <Box flexDirection="column" width={1} height={ROW_ROWS} overflow="hidden">
            {isChosen && Svg ? <Svg source={edgeSvg(rowColor)} alt="" width={EDGE_PX} height={EDGE_HEIGHT_PX} /> : null}
            {isChosen && !Svg ? [0, 1, 2].map(line => <Text key={`edge-${item.id}-${line}`} color={rowColor}>▎</Text>) : null}
          </Box>
          <Box key={`avatar-${item.id}`} width={AVATAR_COLUMNS} height={ROW_ROWS} alignItems="center" justifyContent="center">
            {avatar(item, ROW_AVATAR_PX, false)}
          </Box>
          <Box flexDirection="column" flexGrow={1} height={ROW_ROWS} paddingLeft={1} paddingRight={1} overflow="hidden">
            <Box flexDirection="row" justifyContent="space-between">
              {Client
                ? <Text bold wrap="truncate-end">{title}</Text>
                : <Button key={`pick-${item.id}`} plain label={title} onPress={() => select($, item.id)} />}
              <Text dimColor>{elapsed}</Text>
            </Box>
            <Text wrap="truncate-end">{item.status === 'running' ? <Text color={role.color}>{role.role}</Text> : <Text dimColor>{role.role}</Text>}<Text dimColor> • </Text><Text color={mark.color}>{mark.glyph}</Text><Text dimColor> {item.status}</Text></Text>
            <Text dimColor wrap="truncate-end">{truncate(meta, infoColumns)}</Text>
          </Box>
          {Client && (
            <Box position="absolute" top={0} left={0} width={columns} height={ROW_ROWS}>
              <Client key={`hit-${item.id}`} module="./row-hit.tsx" props={{ id: item.id, rows: ROW_ROWS, hoverColor: isChosen ? 'transparent' : HOVER_BG }} width={columns} height={ROW_ROWS} />
            </Box>
          )}
        </Box>
      )
    }

    // A capped group still shows the open row, so its accordion never hides behind "+ N more".
    const shownOf = (label: string, group: Underling[]) => {
      if (openGroups.includes(label)) return group
      const first = group.slice(0, GROUP_CAP)
      return chosen && group.includes(chosen) && !first.includes(chosen) ? [...first, chosen] : first
    }
    const section = (label: string, group: Underling[], action?: RenderElement) => {
      if (group.length === 0) return null
      const isOpen = openGroups.includes(label)
      const toggle = group.length > GROUP_CAP
        ? <Button key={`toggle-${label}`} plain label={isOpen ? 'Show fewer' : `Show all ${group.length}`} onPress={() => toggleGroup($, label)} />
        : null
      return (
        <Box key={`section-${label}`} flexDirection="column" marginTop={1}>
          <Box flexDirection="row" justifyContent="space-between" paddingRight={1}>
            <Text dimColor bold>{`  ${label.toUpperCase()} · ${group.length}`}</Text>
            <Box flexDirection="row" gap={2}>
              {toggle}
              {action ?? null}
            </Box>
          </Box>
          {shownOf(label, group).map(item => (item.id === chosen?.id
            ? <Box key={`open-${item.id}`} flexDirection="column">{row(item)}{detail(item, chosenEntries, chosenOutput)}</Box>
            : row(item)))}
          {!isOpen && group.length > shownOf(label, group).length ? <Text dimColor>{`  + ${group.length - shownOf(label, group).length} more`}</Text> : null}
        </Box>
      )
    }

    const statCell = (label: string, value: string, width: number, extra?: RenderElement) => (
      <Box flexDirection="column" width={width} borderStyle="single" borderColor={LINE} paddingX={1}>
        <Text dimColor>{label.toUpperCase()}</Text>
        <Text bold>{value}</Text>
        {extra ?? null}
      </Box>
    )

    const detail = (item: Underling, entries: TxEntry[], output: string) => {
      const role = ROLES[item.kind]
      const mark = statusMark(item.status)
      const isSub = item.type === 'subagent'
      const isRunning = item.status === 'running'
      // Once finished the panel's chrome turns grey; status marks, output and transcript keep their colours.
      const tone = isRunning ? role.color : FINISHED_GREY
      const cell = Math.max(10, Math.floor((columns - 2) / 3))
      // The open row and its panel together fit the window, so revealing the panel shows it whole.
      const room = Math.max(6, Math.min(DETAIL_MAX_ROOM, bodyRows - DETAIL_CHROME_ROWS - ROW_ROWS))
      const share = Math.min(1, (item.tokens ?? 0) / 300_000)
      const lines = output ? output.split('\n').length : 0
      const tokenBar = (
        <Box width={cell - 4} height={1} backgroundColor={SUNK_BG}>
          <Box width={Math.max(share > 0 ? 1 : 0, Math.round((cell - 4) * share))} height={1} backgroundColor={tone} />
        </Box>
      )
      let heading = 'OUTPUT'
      if (isSub) heading = isRunning ? 'LIVE TRANSCRIPT' : 'TRANSCRIPT'
      else if (isRunning) heading = 'OUTPUT · READ FROM FILE EVERY 0.5S'
      const exitCode = item.exitCode ?? parseExitMarker(output)
      let exitText = String(exitCode)
      if (exitCode === undefined) exitText = isRunning ? '—' : '?'
      if (exitCode === undefined && isKilled(output)) exitText = 'killed'
      return (
        <Box key={`detail-${item.id}`} flexDirection="column" borderStyle="single" borderColor={tone} marginBottom={1}>
          <Box position="relative" flexDirection="row" gap={2} paddingX={2} paddingY={1} backgroundColor={tint(tone, 0.1)}>
            <Box position="absolute" top={0} right={0}>
              <Button key="close-detail" plain label="✕" onPress={() => update($, selected, () => null)} />
            </Box>
            {avatar(item, DETAIL_AVATAR_PX, true)}
            <Box flexDirection="column" flexGrow={1} justifyContent="flex-end">
              <Text><Text color={tone} backgroundColor={tint(tone, 0.18)}> {role.role} </Text><Text dimColor> {isSub ? `Subagent · ${item.agentType ?? ''}` : 'Background task'}</Text></Text>
              <Text bold>{item.title}</Text>
              <Text><Text color={mark.color}>{mark.glyph}</Text><Text dimColor> {item.status}</Text></Text>
            </Box>
          </Box>
          <Box flexDirection="row">
            {statCell('Running for', formatElapsed((item.endedAt ?? clock) - item.startedAt), cell)}
            {isSub ? statCell('Model', shortModel(item.model), cell) : statCell('Lines out', String(lines), cell)}
            {isSub ? statCell('Tokens', formatTokens(item.tokens ?? 0), cell, tokenBar) : statCell('Exit', exitText, cell)}
          </Box>
          <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
            {isSub ? null : <Code source={sanitize(`$ ${item.command ?? ''}`)} language="bash" />}
            <Box flexDirection="row" justifyContent="space-between">
              <Text><Text color={mark.color}>●</Text><Text dimColor> {heading}</Text></Text>
              {isSub ? null : <Text dimColor>{lines} lines</Text>}
            </Box>
            {isSub
              ? (
                <Box flexDirection="column" borderStyle="round" borderColor={LINE} backgroundColor={SUNK_BG} paddingX={1}>
                  <TranscriptView entries={entries} rows={room} width={columns - 6} color={role.color} ui={ui} />
                </Box>
              )
              : (
                <Box flexDirection="column" borderStyle="round" borderColor={LINE} backgroundColor={SUNK_BG} paddingX={1}>
                  <OutputView text={sanitize(tailLines(output, room))} ui={ui} />
                </Box>
              )}
            {isRunning ? <Button key="stop-detail" label="Stop" onPress={() => stopUnderling($, item.id)} /> : null}
          </Box>
        </Box>
      )
    }

    const chosenEntries = chosen?.type === 'subagent' ? await read($, memberOf(transcriptFamily, { requestId: chosen.id })) : []
    const chosenOutput = chosen?.type === 'bash' ? await read($, memberOf(outputFamily, { requestId: chosen.id })) : ''

    const tree = (
      <Box flexDirection="column" width={columns}>
        <Box flexDirection="row" paddingX={1}>
          <Text bold>🐀 {running.length} underlings digging · {formatTokens(totalTokens)} tokens</Text>
        </Box>
        {section('Subagents', subagents)}
        {section('Background tasks', shells)}
        {section('Finished', finished, <Button key="clear-finished" plain label="Clear" onPress={() => clearFinished($)} />)}
      </Box>
    )
    return tree
  }).catch(($, e, next) => {
    const { Box, Text } = $.ui.resolve(e)
    const reason = next.error.message ?? next.error.kind
    return <Box flexDirection="column" paddingX={1}><Text color="error">Underlings could not draw this pane ({next.error.kind}): {reason.slice(0, 300)}</Text></Box>
  })
}

function OutputView({ text, ui }: { text: string; ui: ElementTable }) {
  const { Box, Text } = ui
  if (!text) return <Text dimColor>(no output yet)</Text>
  return (
    <Box flexDirection="column">
      {text.split('\n').map(line => <Text wrap="wrap">{line || ' '}</Text>)}
    </Box>
  )
}

function TranscriptView({ entries, rows, width, color, ui }: {
  entries: TxEntry[]; rows: number; width: number; color: string; ui: ElementTable
}) {
  const { Box, Text } = ui
  const shown = fitTranscript(entries, rows, width)
  if (shown.length === 0) return <Text dimColor>Waiting for the first response…</Text>
  return (
    <Box flexDirection="column">
      {shown.map((entry, i) => {
        if (entry.kind !== 'tool') {
          return entry.kind === 'thinking' ? <Text dimColor italic>✻ {entry.text}</Text> : <Text>{entry.text}</Text>
        }
        return (
          <Box key={`tx-${i}`} flexDirection="column">
            <Text wrap="truncate-end"><Text color={color} bold>{entry.name}</Text> <Text dimColor>{entry.arg}</Text>{entry.result === undefined ? <Text dimColor> running…</Text> : null}</Text>
            {entry.result === undefined ? null : <Text dimColor color={entry.isError ? 'error' : undefined} wrap="truncate-end">  ⎿ {entry.result}</Text>}
          </Box>
        )
      })}
    </Box>
  )
}
