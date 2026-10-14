import { expect, test } from 'claude-code/testing'

import {
  apply, parseBash, parseCiEvent, parseMonitor, phaseLook, pipRows, pips, sanitize, staminaColor, statusLine, visible,
} from '../model'
import type { WheelEvent } from '../model'
import type { Offering } from '../../../types'
import { CI_EVENT, PR, PR_CREATE_OUTPUT, PR_URL, REPO, SCRIPT, scriptCommand } from './fixtures'

function run(events: WheelEvent[], start: Offering[] = []) {
  let offerings = start
  const texts: string[] = []
  const alerts: string[] = []
  const appeared: string[] = []
  events.forEach((event, i) => {
    const applied = apply(offerings, event, 1_000 + i)
    offerings = applied.offerings
    texts.push(...applied.logs.map(entry => entry.text))
    alerts.push(...applied.alerts.map(alert => alert.text))
    appeared.push(...applied.appeared)
  })
  return { offerings, texts, alerts, appeared }
}

const noiseRound = (n: number) => ({ type: 'ingest', repo: REPO, pr: PR, plan: {
  action: 'handle', noise_count: n, noise_limit: 3, round_count: n + 1, round_limit: 10,
  rounds: [{ kind: 'noise', findings: [{ severity: 'Low' }] }],
} }) as WheelEvent

test('gh pr create with its URL in the output raises an offering; other Bash calls are ignored', () => {
  expect(parseBash('gh pr create --draft --title "Add warp-cannon"', PR_CREATE_OUTPUT)).toEqual({ type: 'raised', repo: REPO, pr: PR })
  expect(parseBash('gh pr create --draft', 'error: no commits')).toBeUndefined()
  expect(parseBash(`gh pr view ${PR}`, PR_URL)).toBeUndefined()
})

test('the skill script subcommands are read from the command and their JSON output', () => {
  expect(parseBash(scriptCommand('ingest'), '{\n  "action": "handle",\n  "noise_count": 1\n}'))
    .toEqual({ type: 'ingest', repo: REPO, pr: PR, plan: { action: 'handle', noise_count: 1 } })
  expect(parseBash(`${SCRIPT} reply --thread PRRT_x --body-file reply.md --resolve`, '{"thread": "PRRT_x", "replied": true, "resolved": true}'))
    .toEqual({ type: 'reply', resolved: true })
  expect(parseBash(scriptCommand('wait', '--thread PRRT_x'), '{"waiting_on_user": ["PRRT_x"]}'))
    .toEqual({ type: 'wait', repo: REPO, pr: PR, waiting: 1 })
  expect(parseBash(scriptCommand('continue'), '{"continued": true}')).toEqual({ type: 'continue', repo: REPO, pr: PR })
  expect(parseBash(scriptCommand('check'), 'Error: gh exited 1')).toBeUndefined()
})

test('the script is found on POSIX and Windows paths, quoted or not', () => {
  const args = `ingest --repo ${REPO} --pr ${PR}`
  for (const path of ['/home/rat/skills/scripts/review-state.js', '"D:\\warren\\skills\\scripts\\review-state.js"', 'scripts\\review-state.js']) {
    expect(parseBash(`node ${path} ${args}`, '{"action": "nothing"}'), path).toMatchObject({ type: 'ingest', pr: PR })
  }
  expect(parseBash(`node review_state.js ${args}`, '{"action": "nothing"}')).toBeUndefined()
})

test('set_monitor reads on/off from its input and the PR from its URL or its answer', () => {
  expect(parseMonitor({ auto_fix: true, url: PR_URL }, ''))
    .toEqual({ type: 'monitor', repo: REPO, pr: PR, autoFix: true, denied: undefined })
  expect(parseMonitor({ auto_fix: false }, `Auto-fix is off for ${REPO}#56.`))
    .toEqual({ type: 'monitor', repo: REPO, pr: 56, autoFix: false, denied: undefined })
  expect(parseMonitor({ auto_archive_on_close: true }, '')).toBeUndefined()
})

test('a ci-monitor-event names its PR and why it woke the session', () => {
  expect(parseCiEvent(CI_EVENT)).toEqual({ type: 'wake', repo: REPO, pr: PR, failedChecks: 1, newComments: 2, conflict: false })
  expect(parseCiEvent('the app will wake this session with a `<ci-monitor-event>` on CI failures')).toBeUndefined()
})

test('without the skill, a raised and armed PR stays out of sight: no status line, alert or appearance', () => {
  const { offerings, alerts, appeared } = run([
    { type: 'raised', repo: REPO, pr: PR },
    { type: 'monitor', repo: REPO, pr: PR, autoFix: true },
    parseCiEvent(CI_EVENT) as WheelEvent,
    { type: 'turnEnd' },
  ])
  expect(offerings).toHaveLength(1)
  expect(visible(offerings)).toEqual([])
  expect(statusLine(offerings)).toBeUndefined()
  expect(alerts).toEqual([])
  expect(appeared).toEqual([])
})

test('the first skill output makes the wheel appear, keeping what was seen before it', () => {
  const hidden = run([
    { type: 'raised', repo: REPO, pr: PR },
    { type: 'monitor', repo: REPO, pr: PR, autoFix: true },
  ])
  const shown = run([noiseRound(1), noiseRound(2)], hidden.offerings)
  expect(shown.appeared).toEqual([`${REPO}#${PR}`])
  expect(visible(shown.offerings)[0]?.autoFix).toBe(true)
  expect(hidden.texts).toContain('An offering is laid before the Council: PR #42')
  expect(statusLine(shown.offerings)).toBe('⚙ Doomwheel #42 · Spinning · heat ▰▰▱ · round 3/10')
})

test('a reply with no shown wheel is logged nowhere', () => {
  expect(run([{ type: 'raised', repo: REPO, pr: PR }, { type: 'reply', resolved: true }]).texts)
    .toEqual(['An offering is laid before the Council: PR #42'])
})

test('a full life: raised, armed, woken, three noise rounds overheat it, disarmed, then retired', () => {
  const { offerings, texts, alerts } = run([
    { type: 'raised', repo: REPO, pr: PR },
    { type: 'monitor', repo: REPO, pr: PR, autoFix: true },
    parseCiEvent(CI_EVENT) as WheelEvent,
    noiseRound(1),
    { type: 'turnEnd' },
    noiseRound(2),
    { ...noiseRound(3), plan: { ...(noiseRound(3) as { plan: object }).plan, action: 'halt',
      instruction: 'Noise limit (3 noise rounds) reached. Leave these findings as they are.' } } as WheelEvent,
    { type: 'monitor', repo: REPO, pr: PR, autoFix: false },
  ])
  const [wheel] = offerings
  expect(wheel?.phase).toBe('halted')
  expect(wheel?.autoFix).toBe(false)
  expect(wheel?.noise).toBe(3)
  expect(wheel?.haltReason).toBe('Noise limit (3 noise rounds) reached')
  expect(texts).toContain('Warp-bolt! The app squeaks: 1 trial-pit failed, 2 new review comments')
  expect(texts).toContain('Round 4: Low-only chatter (1 finding). Heat rises to 3/3!')
  expect(alerts.filter(alert => alert.includes('overheated'))).toHaveLength(1)

  const closed = apply(offerings, { type: 'check', repo: REPO, pr: PR, report: { pr_state: 'MERGED' } }, 9_000)
  expect(closed.offerings[0]?.phase).toBe('closed')
  expect(statusLine(closed.offerings)).toBeUndefined()
})

test('a repeated halt does not alert twice', () => {
  const halt = { type: 'ingest', repo: REPO, pr: PR, plan: { action: 'halt', instruction: "This PR is halted. Report to the human; act only if they say 'continue'." } } as WheelEvent
  const { alerts, offerings } = run([halt, halt])
  expect(alerts).toEqual(["⛔ Doomwheel halted on #42: This PR is halted. Your decision is needed."])
  expect(phaseLook(offerings[0] as Offering).label).toBe('Halted')
})

test('the round cap exhausts the rat: it tires at round 7 and collapses at 10, apart from the noise strikes', () => {
  const signalRound = (n: number, action = 'handle', instruction?: string) => ({
    type: 'ingest', repo: 'o/r', pr: 9, plan: {
      action, instruction, noise_count: 1, noise_limit: 3, round_count: n, round_limit: 10,
      rounds: [{ kind: 'signal', findings: [{ severity: 'Medium' }] }],
    },
  }) as WheelEvent
  const { offerings, texts, alerts } = run([
    signalRound(6),
    signalRound(7),
    signalRound(8),
    signalRound(10, 'halt', 'Round limit (10 rounds) reached. Leave these findings as they are.'),
  ])
  expect(texts.filter(text => text.startsWith('The wheel-rat pants'))).toEqual(['The wheel-rat pants and sweats — round 7/10, 3 laps left'])
  expect(texts).toContain('EXHAUSTED! Round limit (10 rounds) reached — the wheel-rat collapses mid-lap!')
  expect(alerts).toEqual(['🥵 Doomwheel exhausted on #9: Round limit (10 rounds) reached. Your decision is needed.'])
  expect(offerings[0]?.haltKind).toBe('rounds')
  expect(offerings[0]?.noise).toBe(1)
  expect(statusLine(offerings)).toBe('⚙ Doomwheel #9 · Exhausted · heat ▰▱▱ · round 10/10')
})

test('rounds the skill has not recorded yet are not logged as rounds', () => {
  const { texts } = run([{ type: 'ingest', repo: REPO, pr: PR, plan: {
    action: 'judge_severity', noise_count: 0, noise_limit: 3, round_count: 2, round_limit: 10,
    rounds: [{ findings: [{ severity: null }] }],
  } }])
  expect(texts).toEqual(["The reviewer's runes are smudged — judging severity by snout"])
})

test('a human round reads as a human review', () => {
  const { texts } = run([{ type: 'ingest', repo: REPO, pr: PR, plan: {
    action: 'handle', noise_count: 0, noise_limit: 3, round_count: 2, round_limit: 10,
    rounds: [{ kind: 'human', findings: [{ severity: null }, { severity: null }] }],
  } }])
  expect(texts).toEqual(['Round 2: a man-thing reviews — 2 findings'])
})

test('stamina turns amber once tired and red at the cap; continue clears the halt kind', () => {
  expect(staminaColor(6, 10)).toBeUndefined()
  expect(staminaColor(7, 10)).toBe('#d9a441')
  expect(staminaColor(10, 10)).toBe('#e0574a')
  const raised = run([{ type: 'raised', repo: 'o/r', pr: 1 }]).offerings[0] as Offering
  const halted: Offering[] = [{ ...raised, isShepherded: true, phase: 'halted', haltKind: 'rounds' }]
  expect(phaseLook(halted[0] as Offering).label).toBe('Exhausted')
  const resumed = apply(halted, { type: 'continue', repo: 'o/r', pr: 1 }, 5).offerings[0]
  expect(resumed?.haltKind).toBeUndefined()
  expect(resumed?.phase).toBe('waking')
})

test('a wake settles back to spinning when the turn ends', () => {
  const { offerings } = run([parseCiEvent(CI_EVENT) as WheelEvent])
  expect(offerings[0]?.phase).toBe('waking')
  expect(apply(offerings, { type: 'turnEnd' }, 5_000).offerings[0]?.phase).toBe('armed')
})

test('check reports open threads, or that the Council is appeased', () => {
  const base = run([{ type: 'raised', repo: 'o/r', pr: 1 }]).offerings
  const open = apply(base, { type: 'check', repo: 'o/r', pr: 1, report: { ok: false, pr_state: 'OPEN', threads: [{}, {}], pm_comments: [] } }, 2)
  expect(open.offerings[0]?.openThreads).toBe(2)
  expect(open.logs[0]?.text).toBe('2 threads still squeak for answers')
  const done = apply(open.offerings, { type: 'check', repo: 'o/r', pr: 1, report: { ok: true, pr_state: 'OPEN', threads: [], pm_comments: [] } }, 3)
  expect(done.logs[0]?.text).toBe('Every thread answered — the Council is appeased')
})

test('the status line follows the most recently active shown wheel', () => {
  const { offerings } = run([
    { type: 'raised', repo: 'o/r', pr: 1 },
    { type: 'monitor', repo: 'o/r', pr: 1, autoFix: true },
    noiseRound(1),
  ])
  expect(statusLine(offerings)).toBe('⚙ Doomwheel #42 · Spinning · heat ▰▱▱ · round 2/10')
  expect(pips(5, 3)).toBe('▰▰▰')
  expect(pipRows(7, 10, 5)).toEqual(['▰▰▰▰▰', '▰▰▱▱▱'])
  expect(pipRows(0, 3, 5)).toEqual(['▱▱▱'])
})

test('sanitize drops escape sequences and control characters', () => {
  expect(sanitize('\u001b[31mred\u001b[0m\u0007 line\r\nnext\ttab')).toBe('red line next tab')
})
