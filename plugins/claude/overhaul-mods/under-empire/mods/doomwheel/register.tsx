import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface as Engine, Register } from 'claude-code'

import type { LogEntry, Offering } from '../../types'
import {
  LOG_GLYPHS, LOG_LIMIT, PHASES, apply, clock, heatColor, parseBash, parseCiEvent, parseMonitor, phaseLook, pipRows, pips,
  isRetired, sanitize, staminaColor, statusLine, textsIn, visible,
} from './model'
import type { WheelEvent } from './model'
import { glyphOf, wheelSvg } from './sprites'

const PANE = 'doomwheel'
const PANE_TITLE = '⚙ Doomwheel'
const WHEEL_PX = 88
const CARD_LOG_LINES = 6
const CARD_CAP = 3
const ROUND_PIPS_PER_ROW = 5
const LINE = 'rgba(128,128,128,0.35)'
const SUNK_BG = 'rgba(0,0,0,0.22)'
const BAD = '#e0574a'
const SET_MONITOR_RE = /(^|__)set_monitor$/

// The plugin is under-empire; every key Doomwheel owns there starts `doomwheel.`.
const offerings = atom({ plugin: 'under-empire', key: 'doomwheel.offerings' } as const, [] as Offering[])
const log = atom({ plugin: 'under-empire', key: 'doomwheel.log' } as const, [] as LogEntry[])

// ---------------------------------------------------------------- dispatch

async function dispatch($: Engine, event: WheelEvent) {
  const before = await read($, offerings)
  const applied = apply(before, event, Date.now())
  await update($, offerings, () => applied.offerings)
  if (applied.logs.length > 0) {
    await update($, log, entries => [...entries, ...applied.logs].slice(-LOG_LIMIT))
  }
  // Alerts arrive filtered: an offering the skill has not spoken for raises none.
  if (applied.appeared.length > 0 || applied.alerts.some(alert => alert.isUrgent)) {
    await $.ui.open({ id: PANE, title: PANE_TITLE }).catch(() => undefined)
  }
  for (const alert of applied.alerts) {
    $.ui.toast(alert.text)
    if (alert.isUrgent) await $.ui.notify(alert.text, { title: 'Doomwheel' }).catch(() => undefined)
  }
  // Out of sight means out of the status line too: it is touched only while a wheel is or was shown.
  if (visible(before).length > 0 || visible(applied.offerings).length > 0) await refreshStatus($, applied.offerings)
}

async function refreshStatus($: Engine, items?: Offering[]) {
  $.ui.status(statusLine(items ?? await read($, offerings)))
}

function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(block => contentText((block as { text?: unknown; content?: unknown }).text ?? (block as { content?: unknown }).content)).join('\n')
  }
  return ''
}

function eventFromToolCall(e: Record<string, unknown>, ran: unknown): WheelEvent | undefined {
  const answer = ran as { deny?: string; result?: unknown }
  const tool = String(e.tool ?? '')
  if (SET_MONITOR_RE.test(tool)) {
    return parseMonitor(e, textsIn(answer.result).join('\n'), answer.deny)
  }
  if ((tool !== 'Bash' && tool !== 'PowerShell') || answer.deny || !answer.result) return undefined
  const result = answer.result as { stdout?: unknown }
  const output = typeof result.stdout === 'string' ? result.stdout : textsIn(answer.result).join('\n')
  return parseBash(String(e.command ?? ''), output)
}

/** Clears the shown wheels that are cold or retired; offerings still out of sight are kept. */
async function clearRetired($: Engine) {
  const kept = (await read($, offerings)).filter(one => !(one.isShepherded && isRetired(one)))
  const keys = new Set(kept.map(one => one.key))
  await update($, offerings, () => kept)
  await update($, log, entries => entries.filter(entry => keys.has(entry.key)))
  await refreshStatus($, kept)
}

// ---------------------------------------------------------------- hooks

// The engine takes one unmatched hook per event from a plugin, and Underlings holds those on the
// events both mods watch. So each of Doomwheel's hooks there names what it watches in a matcher.

/** Every session start, interactive or not. */
const ANY_SESSION = { isInteractive: [true, false] }
/** The tools whose calls carry Doomwheel's signals: shell runs and the desktop app's set_monitor. */
const WATCHED_TOOLS = { tool: ['Bash', 'PowerShell', SET_MONITOR_RE] }
/** Every door but a tool result's: a genuine wake is its own message, and event-shaped text inside tool output is data. */
const WAKE_DOORS = { door: ['prompt', 'command', 'response', 'tool-message', 'delivery', 'attachment', 'hook-context', 'note', 'compaction', 'notice'] }
/** Every turn, aborted or not. */
const ANY_TURN = { isAborted: [true, false] }

export const register: Register = on => {
  on('session.start', ANY_SESSION, async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'doomwheel', description: 'Show the Doomwheel pane: Auto-fix and PR review rounds' })
    const items = await read($, offerings)
    if (visible(items).length > 0) await refreshStatus($, items).catch(() => undefined)
    return started
  })

  on('command.run', { command: 'doomwheel' }, async $ => {
    await $.ui.open({ id: PANE, title: PANE_TITLE })
    return { text: 'Doomwheel pane opened.' }
  })

  on('tool.call', WATCHED_TOOLS, async ($, e, next) => {
    const ran = await next(e)
    if (!(e as { agentId?: string }).agentId) {
      const event = eventFromToolCall(e as Record<string, unknown>, ran)
      if (event) await dispatch($, event).catch(() => undefined)
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('session.append', WAKE_DOORS, async ($, e, next) => {
    const stored = await next(e)
    if (!e.agentId) {
      const event = parseCiEvent(contentText(e.message.content))
      if (event) await dispatch($, event).catch(() => undefined)
    }
    return stored
  }).catch(($, e, next) => next(e))

  on('turn.complete', ANY_TURN, async ($, e, next) => {
    if (!e.agentId) await dispatch($, { type: 'turnEnd' }).catch(() => undefined)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const Svg = e.surface === 'terminal' ? undefined : (ui as ElementTable<'desktop'>).Svg
    const items = visible(await read($, offerings))
    const entries = await read($, log)
    const columns = e.props.bodyColumns

    if (items.length === 0) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text dimColor>The Doomwheel stands idle. It turns once the shepherding-pr-reviews skill runs a review round on a PR.</Text>
        </Box>
      )
    }

    const newestFirst = [...items].sort((a, b) => b.updatedAt - a.updatedAt)
    const shown = newestFirst.slice(0, CARD_CAP)
    const retired = items.filter(isRetired).length
    const live = items.filter(one => one.phase !== 'closed').length
    const cell = Math.max(12, Math.floor((columns - 2) / 3))

    const statCell = (label: string, value: string, color?: string) => (
      <Box flexDirection="column" width={cell} borderStyle="single" borderColor={LINE} paddingX={1}>
        <Text dimColor>{label}</Text>
        <Text bold color={color}>{value}</Text>
      </Box>
    )

    const roundsCell = (item: Offering) => {
      const color = staminaColor(item.rounds, item.roundLimit)
      return (
        <Box flexDirection="column" width={cell} borderStyle="single" borderColor={LINE} paddingX={1}>
          <Text dimColor>ROUNDS</Text>
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Box flexDirection="column">
              {pipRows(item.rounds, item.roundLimit, ROUND_PIPS_PER_ROW).map((row, i) => (
                <Text key={`rounds-${item.key}-${i}`} bold color={color}>{row}</Text>
              ))}
            </Box>
            <Text bold color={color}>{`${item.rounds}/${item.roundLimit}`}</Text>
          </Box>
        </Box>
      )
    }

    const card = (item: Offering) => {
      const phase = phaseLook(item)
      const mood = item.haltReason ?? PHASES[item.phase].mood
      const heat = heatColor(item.noise, item.noiseLimit)
      const lines = entries.filter(entry => entry.key === item.key).slice(-CARD_LOG_LINES)
      const isStillArmed = item.phase === 'halted' && item.autoFix
      const threads = item.openThreads === undefined ? '—' : String(item.openThreads)
      return (
        <Box key={`card-${item.key}`} flexDirection="column" borderStyle="single" borderColor={phase.color} marginTop={1}>
          <Box flexDirection="row" gap={2} paddingX={1} paddingY={1}>
            {Svg
              ? <Svg source={wheelSvg(item, WHEEL_PX)} alt={`Doomwheel: ${phase.label}`} width={WHEEL_PX} height={WHEEL_PX} />
              : <Text color={phase.color}>{glyphOf(item)}</Text>}
            <Box flexDirection="column" flexGrow={1} justifyContent="center">
              <Text bold wrap="truncate-end">{`Offering #${item.pr} · ${item.repo}`}</Text>
              <Text wrap="wrap"><Text color={phase.color} bold>{phase.label}</Text><Text dimColor> — {sanitize(mood)}</Text></Text>
              <Text dimColor>{`Auto-fix ${item.autoFix ? 'on' : 'off'}`}</Text>
              {isStillArmed ? <Text color={BAD} bold>Auto-fix is still on — the wheel must be cut!</Text> : null}
            </Box>
          </Box>
          <Box flexDirection="row">
            {statCell('HEAT', `${pips(item.noise, item.noiseLimit)} ${item.noise}/${item.noiseLimit}`, heat)}
            {roundsCell(item)}
            {statCell('THREADS', item.waiting > 0 ? `${threads} · ${item.waiting} wait` : threads)}
          </Box>
          <Box flexDirection="column" paddingX={1} paddingY={1}>
            <Text dimColor>SQUEAK-SCROLL</Text>
            <Box flexDirection="column" borderStyle="round" borderColor={LINE} backgroundColor={SUNK_BG} paddingX={1}>
              {lines.length === 0
                ? <Text dimColor>Nothing squeaked yet.</Text>
                : lines.map((entry, i) => (
                  <Text key={`log-${item.key}-${i}`} wrap="wrap"><Text dimColor>{clock(entry.at)} </Text><Text color={entry.kind === 'halt' ? BAD : undefined}>{LOG_GLYPHS[entry.kind]} {sanitize(entry.text)}</Text></Text>
                ))}
            </Box>
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" width={columns}>
        <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
          <Text bold>{`⚙ ${live} wheel${live === 1 ? '' : 's'} turning for the Council`}</Text>
          {retired > 0 ? <Button key="clear-retired" plain label={`Clear ${retired} retired`} onPress={() => clearRetired($)} /> : null}
        </Box>
        {shown.map(card)}
        {newestFirst.length > shown.length ? <Text dimColor>{`  + ${newestFirst.length - shown.length} older offerings`}</Text> : null}
      </Box>
    )
  }).catch(($, e, next) => {
    const { Box, Text } = $.ui.resolve(e)
    const reason = next.error.message ?? next.error.kind
    return <Box flexDirection="column" paddingX={1}><Text color="error">Doomwheel could not draw this pane ({next.error.kind}): {reason.slice(0, 300)}</Text></Box>
  })
}
