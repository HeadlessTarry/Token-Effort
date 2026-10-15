import { expect, test } from 'claude-code/testing'

import {
  apply, ghTouches, heatColor, heatOf, parseBash, parseCiEvent, parseMonitor, parsePrRef, parseSnapshot, readPoll, revive,
  sanitize, threadsGauge,
} from '../model'
import type { Alert, Snapshot, WheelEvent } from '../model'
import type { Offering } from '../../../types'
import { CI_EVENT, PR, PR_CREATE_OUTPUT, PR_URL, REPO, ghAnswer } from './fixtures'
import type { PrShape } from './fixtures'

function run(events: WheelEvent[], start: Offering[] = []) {
  let offerings = start
  const texts: string[] = []
  const alerts: Alert[] = []
  const appeared: string[] = []
  events.forEach((event, i) => {
    const applied = apply(offerings, event, 1_000 + i)
    offerings = applied.offerings
    texts.push(...applied.logs.map(entry => entry.text))
    alerts.push(...applied.alerts)
    appeared.push(...applied.appeared)
  })
  return { offerings, wheel: offerings[0] as Offering, texts, alerts, appeared }
}

const snapshot = (shape: PrShape): Snapshot => parseSnapshot(ghAnswer(shape)) as Snapshot
const poll = (shape: PrShape = {}): WheelEvent => ({ type: 'poll', repo: REPO, pr: PR, snapshot: snapshot(shape) })
const raised: WheelEvent = { type: 'raised', repo: REPO, pr: PR }
const arm: WheelEvent = { type: 'monitor', repo: REPO, pr: PR, autoFix: true }
const cut: WheelEvent = { type: 'monitor', repo: REPO, pr: PR, autoFix: false }

// ---------------------------------------------------------------- session signals

test('gh pr create with its URL in the output raises an offering; other Bash calls are ignored', () => {
  expect(parseBash('gh pr create --draft --title "Add warp-cannon"', PR_CREATE_OUTPUT)).toEqual({ type: 'raised', repo: REPO, pr: PR })
  expect(parseBash('gh pr create --draft', 'error: no commits')).toBeUndefined()
  expect(parseBash(`gh pr view ${PR}`, PR_URL)).toBeUndefined()
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

test('/doomwheel takes a PR URL or owner/name#N', () => {
  expect(parsePrRef(PR_URL)).toEqual({ repo: REPO, pr: PR })
  expect(parsePrRef(`${REPO}#7`)).toEqual({ repo: REPO, pr: 7 })
  expect(parsePrRef('the big one')).toBeUndefined()
})

test('a gh call touches the tracked PRs it names, by URL, key or number', () => {
  const { offerings } = run([raised, { type: 'raised', repo: 'o/r', pr: 7 }])
  expect(ghTouches(`gh pr view ${PR} --repo ${REPO}`, offerings)).toEqual([`${REPO}#${PR}`])
  expect(ghTouches(`gh pr checks ${PR_URL}`, offerings)).toEqual([`${REPO}#${PR}`])
  expect(ghTouches('gh api repos/o/r/pulls/7/comments', offerings)).toEqual(['o/r#7'])
  expect(ghTouches(`git log -${PR}`, offerings)).toEqual([])
  expect(ghTouches('gh pr view 420', offerings)).toEqual([])
})

// ---------------------------------------------------------------- polling

test('a poll reads submitted reviews, threads, failing checks and a conflict', () => {
  const answer = JSON.parse(ghAnswer({ reviews: ['copilot:COMMENTED', 'rat:APPROVED'], unresolved: 2, resolved: 1, failing: 2, conflict: true }))
  answer.data.repository.pullRequest.reviews.nodes.push({ state: 'PENDING', author: { login: 'drafting' } })
  expect(parseSnapshot(JSON.stringify(answer))).toEqual({
    state: 'OPEN',
    reviews: [{ author: 'copilot', state: 'COMMENTED' }, { author: 'rat', state: 'APPROVED' }],
    unresolvedThreads: 2, totalThreads: 3, failingChecks: 2, conflict: true,
  })
  expect(parseSnapshot('{"data": {"repository": {"pullRequest": null}}}')).toBeUndefined()
  expect(parseSnapshot('not json')).toBeUndefined()
})

test('gh without a login reads as unavailable; any other failure says nothing', () => {
  expect(readPoll(REPO, PR, { exitCode: 0, stdout: ghAnswer(), stderr: '' })).toMatchObject({ type: 'poll', repo: REPO, pr: PR })
  expect(readPoll(REPO, PR, { exitCode: 4, stdout: '', stderr: '' })).toEqual({ type: 'ghUnavailable', repo: REPO, pr: PR })
  expect(readPoll(REPO, PR, { exitCode: 1, stdout: '', stderr: 'To get started with GitHub CLI, please run:  gh auth login' }))
    .toEqual({ type: 'ghUnavailable', repo: REPO, pr: PR })
  expect(readPoll(REPO, PR, { exitCode: 1, stdout: '', stderr: 'HTTP 502: Bad Gateway' })).toBeUndefined()
})

test('the gauges: HEAT adds threads, failing checks and a conflict; LAPS counts reviews; THREADS reads unresolved/total', () => {
  const { wheel } = run([raised, poll({ reviews: ['a:COMMENTED', 'b:COMMENTED', 'c:APPROVED'], unresolved: 2, resolved: 3, failing: 1, conflict: true })])
  expect(heatOf(wheel)).toBe(4)
  expect(wheel.laps).toBe(3)
  expect(threadsGauge(wheel)).toEqual({ text: '2/5', color: '#e0574a' })
  expect(threadsGauge(run([raised, poll({ resolved: 2 })]).wheel)).toEqual({ text: '0/2', color: '#5fbf5a' })
  expect(threadsGauge(run([raised]).wheel)).toEqual({ text: '—' })
})

test('the crystal is green at no heat and red from 5', () => {
  expect(heatColor(0)).toBe('#5fbf5a')
  expect(heatColor(5)).toBe('#e0574a')
  expect(heatColor(9)).toBe('#e0574a')
  expect(heatColor(2)).not.toBe('#5fbf5a')
})

test('changes between polls are logged; a poll that changes nothing writes nothing', () => {
  const first = run([raised, poll({ reviews: ['copilot:COMMENTED'], unresolved: 2, resolved: 0, failing: 1, conflict: true })])
  expect(first.texts).toEqual([
    'An offering is laid before the Council: PR #42',
    'copilot comments — lap 1',
    'Unresolved threads rise to 2/2',
    'The trial-pits run red: 1 failing check',
    'A merge conflict! Rival tunnels collide',
  ])
  const same = run([poll({ reviews: ['copilot:COMMENTED'], unresolved: 2, failing: 1, conflict: true })], first.offerings)
  expect(same.texts).toEqual([])
  const better = run([poll({ reviews: ['copilot:COMMENTED', 'rat:CHANGES_REQUESTED'], unresolved: 1, resolved: 1 })], first.offerings)
  expect(better.texts).toEqual([
    'rat demands changes — lap 2',
    'Unresolved threads fall to 1/2',
    'The trial-pits recover — all green',
    'The merge conflict is cleared',
  ])
  expect(run([poll({ resolved: 2 })], better.offerings).texts).toEqual(['Every thread resolved — the Council is appeased'])
})

test('the rat tires at lap 7, and a flood of reviews is one line', () => {
  const six = Array.from({ length: 6 }, (_, i) => `r${i}:COMMENTED`)
  const { offerings, texts } = run([raised, poll({ reviews: six })])
  expect(texts).toContain('6 reviews submitted — lap 6')
  expect(run([poll({ reviews: [...six, 'r6:APPROVED'] })], offerings).texts)
    .toEqual(['r6 approves — lap 7', 'The wheel-rat pants and sweats — lap 7'])
})

// ---------------------------------------------------------------- phases and alerts

test('raised is an offering; arming spins it with a toast; a wake races it until the turn ends', () => {
  const offered = run([raised])
  expect(offered.wheel.phase).toBe('offering')
  expect(offered.appeared).toEqual([`${REPO}#${PR}`])
  expect(offered.alerts).toEqual([])
  const armed = run([arm], offered.offerings)
  expect(armed.wheel.phase).toBe('armed')
  expect(armed.alerts).toEqual([{ key: `${REPO}#${PR}`, text: '⚙ Doomwheel armed for #42', notify: false, openPane: false }])
  const woken = run([parseCiEvent(CI_EVENT) as WheelEvent], armed.offerings)
  expect(woken.wheel.phase).toBe('waking')
  expect(woken.texts).toEqual(['Warp-bolt! The app squeaks: 1 trial-pit failed, 2 new review comments'])
  expect(run([{ type: 'turnEnd' }], woken.offerings).wheel.phase).toBe('armed')
})

test('cutting Auto-fix with work left cracks the wheel, with a toast, a notification and the pane', () => {
  const { wheel, alerts, texts } = run([raised, arm, poll({ unresolved: 1 }), cut])
  expect(wheel.phase).toBe('cracked')
  expect(alerts.at(-1)).toEqual({
    key: `${REPO}#${PR}`, text: '💥 Doomwheel cracked on #42: Auto-fix is off with work left. Your decision is needed.', notify: true, openPane: true,
  })
  expect(texts).toContain('The wheel CRACKS! Auto-fix cut with 1 wound still open')
})

test('cutting Auto-fix with no work left goes cold, quietly', () => {
  const { wheel, alerts } = run([raised, arm, poll({ resolved: 2 }), cut])
  expect(wheel.phase).toBe('cold')
  expect(alerts.filter(alert => alert.notify)).toEqual([])
})

test('a cracked wheel re-arms, or cools once its open work drops to zero', () => {
  const cracked = run([raised, arm, poll({ failing: 1 }), cut]).offerings
  expect(run([arm], cracked).wheel.phase).toBe('armed')
  const cooled = run([poll({ failing: 0 })], cracked)
  expect(cooled.wheel.phase).toBe('cold')
  expect(cooled.texts).toContain('The last wound closes — the cracked wheel cools')
  expect(run([poll({ failing: 2 })], cracked).wheel.phase).toBe('cracked')
})

test('merged is victory, with a toast and the pane; closed is scrapped, silently; both are retired', () => {
  const won = run([raised, arm, poll({ state: 'MERGED' })])
  expect(won.wheel.phase).toBe('victory')
  expect(won.alerts.at(-1)).toEqual({ key: `${REPO}#${PR}`, text: '🏆 Doomwheel victory: #42 is merged', notify: false, openPane: true })
  const lost = run([raised, poll({ state: 'CLOSED' })])
  expect(lost.wheel.phase).toBe('scrapped')
  expect(lost.alerts).toEqual([])
  expect(lost.texts).toContain('Scrapped. The offering is closed unmerged — the wheel collapses')
  // Retired wheels ignore later polls and Auto-fix flips.
  expect(run([poll({ state: 'OPEN', unresolved: 3 }), cut], won.offerings).wheel.phase).toBe('victory')
})

test('gh unavailable is flagged on the wheel without a log or alert, and a good poll clears it', () => {
  const down = run([raised, { type: 'ghUnavailable', repo: REPO, pr: PR }])
  expect(down.wheel.ghUnavailable).toBe(true)
  expect(down.alerts).toEqual([])
  expect(down.texts).toEqual(['An offering is laid before the Council: PR #42'])
  expect(run([poll()], down.offerings).wheel.ghUnavailable).toBeUndefined()
})

test('a wheel stored by an older Doomwheel revives with its unknown phase as cold and empty gauges', () => {
  const old = { key: 'o/r#1', repo: 'o/r', pr: 1, url: 'https://github.com/o/r/pull/1', phase: 'halted', autoFix: false, createdAt: 1, updatedAt: 1 }
  expect(revive(old as unknown as Offering)).toMatchObject({ phase: 'cold', laps: 0, unresolvedThreads: 0, failingChecks: 0, conflict: false })
})

test('sanitize drops escape sequences and control characters', () => {
  expect(sanitize('\u001b[31mred\u001b[0m\u0007 line\r\nnext\ttab')).toBe('red line next tab')
})
