import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface as Engine, Register, Timer } from 'claude-code'

import type { LogEntry, Offering } from '../../types'
import {
  HEAT_LIMIT, LOG_GLYPHS, LOG_LIMIT, PHASES, apply, clock, ghTouches, heatColor, heatOf, isRetired, keyOf, lapsColor,
  parseBash, parseCiEvent, parseMonitor, parsePrRef, pips, pollArgv, readPoll, revive, sanitize, textsIn, threadsGauge,
} from './model'
import type { WheelEvent } from './model'
import { glyphOf, wheelSvg } from './sprites'

const PANE = 'doomwheel'
const PANE_TITLE = '⚙ Doomwheel'
const WHEEL_PX = 88
const CARD_LOG_LINES = 6
const CARD_CAP = 3
const POLL_MS = 60_000
const POLL_TIMEOUT_MS = 30_000
const LINE = 'rgba(128,128,128,0.35)'
const SUNK_BG = 'rgba(0,0,0,0.22)'
const SET_MONITOR_RE = /(^|__)set_monitor$/

// The plugin is under-empire; every key Doomwheel owns there starts `doomwheel.`.
const offerings = atom({ plugin: 'under-empire', key: 'doomwheel.offerings' } as const, [] as Offering[])
const log = atom({ plugin: 'under-empire', key: 'doomwheel.log' } as const, [] as LogEntry[])

/** The module's own: started once per load, since /reload-plugins starts the module over. */
let ticker: Timer | undefined
const inFlight = new Set<string>()

async function readOfferings($: Engine): Promise<Offering[]> {
  return (await read($, offerings)).map(revive)
}

// ---------------------------------------------------------------- dispatch

async function openPane($: Engine) {
  await $.ui.open({ id: PANE, title: PANE_TITLE }).catch(() => undefined)
}

async function dispatch($: Engine, event: WheelEvent) {
  const before = await readOfferings($)
  const applied = apply(before, event, Date.now())
  await update($, offerings, () => applied.offerings)
  if (applied.logs.length > 0) {
    await update($, log, entries => [...entries, ...applied.logs].slice(-LOG_LIMIT))
  }
  if (applied.appeared.length > 0 || applied.alerts.some(alert => alert.openPane)) {
    await openPane($)
  }
  for (const alert of applied.alerts) {
    $.ui.toast(alert.text)
    if (alert.notify) await $.ui.notify(alert.text, { title: 'Doomwheel' }).catch(() => undefined)
  }
  for (const key of applied.appeared) startPolling($, key, applied.offerings)
}

// ---------------------------------------------------------------- polling

/** Asks GitHub about one PR, once at a time per PR; what it learns is dispatched like any signal. */
async function poll($: Engine, repo: string, pr: number) {
  const key = keyOf(repo, pr)
  if (inFlight.has(key)) return
  inFlight.add(key)
  try {
    let event: WheelEvent | undefined
    try {
      event = readPoll(repo, pr, await $.process.run(pollArgv(repo, pr), { timeoutMs: POLL_TIMEOUT_MS }))
    } catch {
      // `gh` could not start (or never answered): the wheel runs on session signals alone.
      event = { type: 'ghUnavailable', repo, pr }
    }
    if (event) await dispatch($, event)
  } finally {
    inFlight.delete(key)
  }
}

/** Polls each named PR that is still live, without holding up the hook that asked. */
function pollNow($: Engine, keys: string[], items: Offering[]) {
  for (const one of items) {
    if (keys.includes(one.key) && !isRetired(one)) void poll($, one.repo, one.pr).catch(() => undefined)
  }
}

async function pollLive($: Engine) {
  const items = await readOfferings($)
  pollNow($, items.map(one => one.key), items)
}

function ensureTicker($: Engine) {
  ticker ??= $.clock.every(POLL_MS, () => {
    void pollLive($).catch(() => undefined)
  })
}

function startPolling($: Engine, key: string, items: Offering[]) {
  ensureTicker($)
  pollNow($, [key], items)
}

// ---------------------------------------------------------------- signals

function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(block => contentText((block as { text?: unknown; content?: unknown }).text ?? (block as { content?: unknown }).content)).join('\n')
  }
  return ''
}

async function afterToolCall($: Engine, e: Record<string, unknown>, ran: unknown) {
  const answer = ran as { deny?: string; result?: unknown }
  const tool = String(e.tool ?? '')
  if (SET_MONITOR_RE.test(tool)) {
    const event = parseMonitor(e, textsIn(answer.result).join('\n'), answer.deny)
    if (!event) return
    // A cut cracks the wheel only with work left, so GitHub is asked first when the PR is named.
    if (event.type === 'monitor' && event.repo && event.pr && !event.autoFix && !answer.deny) await poll($, event.repo, event.pr)
    await dispatch($, event)
    return
  }
  if ((tool !== 'Bash' && tool !== 'PowerShell') || answer.deny || !answer.result) return
  const result = answer.result as { stdout?: unknown }
  const output = typeof result.stdout === 'string' ? result.stdout : textsIn(answer.result).join('\n')
  const command = String(e.command ?? '')
  const event = parseBash(command, output)
  if (event) await dispatch($, event)
  const items = await readOfferings($)
  pollNow($, ghTouches(command, items), items)
}

/** Clears the retired wheels (merged or closed) and their squeak-scrolls. */
async function clearRetired($: Engine) {
  const kept = (await readOfferings($)).filter(one => !isRetired(one))
  const keys = new Set(kept.map(one => one.key))
  await update($, offerings, () => kept)
  await update($, log, entries => entries.filter(entry => keys.has(entry.key)))
}

// ---------------------------------------------------------------- hooks

// The engine takes one unmatched hook per event from a plugin, and Underlings holds those on the
// events both mods watch. So each of Doomwheel's hooks there names what it watches in a matcher.

/** Every session start, interactive or not. */
const ANY_SESSION = { isInteractive: [true, false] }
/** The tools whose calls carry Doomwheel's signals: shell runs and the desktop app's set_monitor. */
const WATCHED_TOOLS = { tool: ['Bash', 'PowerShell', SET_MONITOR_RE] } as const
/** Every door but a tool result's: a genuine wake is its own message, and event-shaped text inside tool output is data. */
const WAKE_DOORS = { door: ['prompt', 'command', 'response', 'tool-message', 'delivery', 'attachment', 'hook-context', 'note', 'compaction', 'notice'] } as const
/** Every turn, aborted or not. */
const ANY_TURN = { isAborted: [true, false] }

export const register: Register = on => {
  on('session.start', ANY_SESSION, async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'doomwheel', description: 'Show the Doomwheel pane, or add a PR to it: /doomwheel <PR URL>' })
    // Wheels the session kept from before resume polling; retired ones stay as they are.
    const items = await readOfferings($).catch(() => [] as Offering[])
    if (items.some(one => !isRetired(one))) {
      ensureTicker($)
      pollNow($, items.map(one => one.key), items)
    }
    return started
  })

  on('command.run', { command: 'doomwheel' }, async ($, e) => {
    const args = String((e as { args?: unknown }).args ?? '').trim()
    if (!args) {
      await $.ui.open({ id: PANE, title: PANE_TITLE })
      return { text: 'Doomwheel pane opened.' }
    }
    const target = parsePrRef(args)
    if (!target) return { text: 'Doomwheel takes a PR URL, such as https://github.com/owner/name/pull/42, or owner/name#42.' }
    await dispatch($, { type: 'added', ...target })
    await openPane($)
    return { text: `Doomwheel is tracking ${keyOf(target.repo, target.pr)}.` }
  })

  on('tool.call', WATCHED_TOOLS, async ($, e, next) => {
    const ran = await next(e)
    if (!(e as { agentId?: string }).agentId) {
      await afterToolCall($, e as Record<string, unknown>, ran).catch(() => undefined)
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('session.append', WAKE_DOORS, async ($, e, next) => {
    const stored = await next(e)
    if (!e.agentId) {
      const event = parseCiEvent(contentText(e.message.content))
      if (event && event.type === 'wake') {
        await dispatch($, event).catch(() => undefined)
        startPolling($, keyOf(event.repo, event.pr), await readOfferings($))
      }
    }
    return stored
  }).catch(($, e, next) => next(e))

  on('turn.complete', ANY_TURN, async ($, e, next) => {
    if (!e.agentId) {
      await dispatch($, { type: 'turnEnd' }).catch(() => undefined)
      await pollLive($).catch(() => undefined)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const Svg = e.surface === 'terminal' ? undefined : (ui as ElementTable<'desktop'>).Svg
    const items = await readOfferings($)
    const entries = await read($, log)
    const columns = e.props.bodyColumns

    if (items.length === 0) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text dimColor>The Doomwheel stands idle. It turns for a PR this session raises, arms Auto-fix on, or names with /doomwheel &lt;PR URL&gt;.</Text>
        </Box>
      )
    }

    const newestFirst = [...items].sort((a, b) => b.updatedAt - a.updatedAt)
    const shown = newestFirst.slice(0, CARD_CAP)
    const retired = items.filter(isRetired).length
    const live = items.length - retired
    const cell = Math.max(12, Math.floor((columns - 2) / 3))

    const statCell = (label: string, value: string, color?: string) => (
      <Box flexDirection="column" width={cell} borderStyle="single" borderColor={LINE} paddingX={1}>
        <Text dimColor>{label}</Text>
        <Text bold color={color}>{value}</Text>
      </Box>
    )

    const card = (item: Offering) => {
      const phase = PHASES[item.phase]
      const heat = heatOf(item)
      const threads = threadsGauge(item)
      const lines = entries.filter(entry => entry.key === item.key).slice(-CARD_LOG_LINES)
      return (
        <Box key={`card-${item.key}`} flexDirection="column" borderStyle="single" borderColor={phase.color} marginTop={1}>
          <Box flexDirection="row" gap={2} paddingX={1} paddingY={1}>
            {Svg
              ? <Svg source={wheelSvg({ phase: item.phase, heat, laps: item.laps }, WHEEL_PX)} alt={`Doomwheel: ${phase.label}`} width={WHEEL_PX} height={WHEEL_PX} />
              : <Text color={phase.color}>{glyphOf(item)}</Text>}
            <Box flexDirection="column" flexGrow={1} justifyContent="center">
              <Text bold wrap="truncate-end">{`Offering #${item.pr} · ${item.repo}`}</Text>
              <Text wrap="wrap"><Text color={phase.color} bold>{phase.label}</Text><Text dimColor> — {phase.mood}</Text></Text>
              <Text dimColor>{`Auto-fix ${item.autoFix ? 'on' : 'off'}`}</Text>
              {item.ghUnavailable ? <Text dimColor wrap="wrap">gh is missing or not signed in — the wheel turns on session signals alone</Text> : null}
            </Box>
          </Box>
          <Box flexDirection="row">
            {statCell('HEAT', `${pips(heat, HEAT_LIMIT)} ${heat}`, heatColor(heat))}
            {statCell('LAPS', String(item.laps), lapsColor(item.laps))}
            {statCell('THREADS', threads.text, threads.color)}
          </Box>
          <Box flexDirection="column" paddingX={1} paddingY={1}>
            <Text dimColor>SQUEAK-SCROLL</Text>
            <Box flexDirection="column" borderStyle="round" borderColor={LINE} backgroundColor={SUNK_BG} paddingX={1}>
              {lines.length === 0
                ? <Text dimColor>Nothing squeaked yet.</Text>
                : lines.map((entry, i) => (
                  <Text key={`log-${item.key}-${i}`} wrap="wrap"><Text dimColor>{clock(entry.at)} </Text><Text color={entry.kind === 'crack' ? PHASES.cracked.color : undefined}>{LOG_GLYPHS[entry.kind] ?? '·'} {sanitize(entry.text)}</Text></Text>
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
