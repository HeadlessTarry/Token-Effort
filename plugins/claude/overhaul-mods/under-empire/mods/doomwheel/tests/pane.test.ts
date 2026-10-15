import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { CI_EVENT, PR_CREATE_OUTPUT, PR_URL, REPO, ghAnswer } from './fixtures'
import type { PrShape } from './fixtures'

const PANE_PROPS = {
  title: '⚙ Doomwheel',
  isFocused: false,
  bodyColumns: 80,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}
const MOUNT = { plugin: 'under-empire', component: 'Pane', requestId: 'doomwheel', props: PANE_PROPS } as const
const RAISE = { tool: 'Bash', command: 'gh pr create --draft --title "Add warp-cannon"', description: 'Raise PR' }
const ARM = { tool: 'mcp__ccd_pr__set_monitor', auto_fix: true, address_comments: true, url: PR_URL }
const CUT = { tool: 'mcp__ccd_pr__set_monitor', auto_fix: false, address_comments: false, url: PR_URL }

type On = Parameters<TestBody>[1]
type Seen = { opened: string[]; statuses: Array<string | undefined>; toasts: string[]; notified: string[] }
/** What `gh` answers: a PR shape, a failed run, or no `gh` at all. */
type Gh = { shape: PrShape } | { exitCode: number; stderr: string } | 'missing'

/** Answers the engine's ui calls beneath the plugin, recording what Doomwheel asked for. */
function watchUi(on: On): Seen {
  const seen: Seen = { opened: [], statuses: [], toasts: [], notified: [] }
  on('ui.open', (_, e) => {
    seen.opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.status', (_, e) => {
    seen.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', (_, e) => {
    seen.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.notify', (_, e) => {
    seen.notified.push(e.text)
    return { value: { isSent: true } } as never
  })
  return seen
}

/** Each Bash call prints `gh pr create`'s URL; set_monitor answers as the desktop app does. */
function answerTools(on: On) {
  on('tool.call', (_, e) => ((e as { tool?: unknown }).tool === 'Bash'
    ? { result: { stdout: PR_CREATE_OUTPUT, stderr: '', interrupted: false } }
    : { result: [{ type: 'text', text: `Auto-fix is updated for ${REPO}#42.` }] }) as never)
}

/** Answers every `gh` poll from `gh()`, counting them. */
function answerGh(on: On, gh: () => Gh): { polls: number } {
  const count = { polls: 0 }
  on('process.run', (_, e) => {
    if (e.argv[0] !== 'gh') return { value: { exitCode: 127, stdout: '', stderr: 'not found' } } as never
    count.polls += 1
    const now = gh()
    if (now === 'missing') throw new Error('spawn gh ENOENT')
    if ('shape' in now) return { value: { exitCode: 0, stdout: ghAnswer(now.shape), stderr: '' } } as never
    return { value: { exitCode: now.exitCode, stdout: '', stderr: now.stderr } } as never
  })
  return count
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: gh pr create alone opens the pane on a polled wheel`, async ($, on) => {
    const clock = mock.clock(on)
    const seen = watchUi(on)
    answerTools(on)
    const gh = answerGh(on, () => ({ shape: { reviews: ['copilot:COMMENTED', 'rat:APPROVED'], unresolved: 1, resolved: 2, failing: 1 } }))

    await $.tool.call(RAISE as never)
    await clock.settle()

    expect(seen.opened).toEqual(['doomwheel'])
    expect(gh.polls).toBe(1)
    expect(seen.statuses).toEqual([])
    const pane = await $.ui.mount({ ...MOUNT, surface })
    expect(await pane.find({ text: /Offering #42 · clan-skryre\/warp-engine/ })).toBeDefined()
    expect(await pane.find({ text: /Offering laid/ })).toBeDefined()
    expect(await pane.find({ text: /▰▰▱▱▱ 2/ })).toBeDefined()
    expect(await pane.find({ text: /^2$/ })).toBeDefined()
    expect(await pane.find({ text: /^1\/3$/ })).toBeDefined()
    expect(await pane.find({ text: /An offering is laid before the Council/ })).toBeDefined()
    expect(await pane.find({ text: /rat approves — lap 2/ })).toBeDefined()
  })
}

test('arming toasts; polling repeats every 60s and stops once the PR is merged, with a victory toast and the pane', async ($, on) => {
  const clock = mock.clock(on)
  const seen = watchUi(on)
  answerTools(on)
  let state: PrShape['state'] = 'OPEN'
  const gh = answerGh(on, () => ({ shape: { state } }))

  await $.tool.call(RAISE as never)
  await $.tool.call(ARM as never)
  await clock.settle()
  expect(seen.toasts).toEqual(['⚙ Doomwheel armed for #42'])
  expect(seen.notified).toEqual([])
  const before = gh.polls

  await clock.advance(60_000)
  expect(gh.polls).toBe(before + 1)

  state = 'MERGED'
  seen.opened.length = 0
  await clock.advance(60_000)
  expect(seen.toasts.at(-1)).toBe('🏆 Doomwheel victory: #42 is merged')
  expect(seen.opened).toEqual(['doomwheel'])
  const atVictory = gh.polls
  await clock.advance(120_000)
  expect(gh.polls).toBe(atVictory)

  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /^Victory$/ })).toBeDefined()
  await pane.press({ key: 'clear-retired' })
  expect(await pane.find({ text: /The Doomwheel stands idle/ })).toBeDefined()
})

test('desktop: cutting Auto-fix with threads open cracks the wheel, toasts, notifies and opens the pane', async ($, on) => {
  const clock = mock.clock(on)
  const seen = watchUi(on)
  answerTools(on)
  answerGh(on, () => ({ shape: { unresolved: 2 } }))

  await $.tool.call(RAISE as never)
  await $.tool.call(ARM as never)
  await clock.settle()
  seen.opened.length = 0
  await $.tool.call(CUT as never)
  await clock.settle()

  const cracked = '💥 Doomwheel cracked on #42: Auto-fix is off with work left. Your decision is needed.'
  expect(seen.notified).toEqual([cracked])
  expect(seen.toasts.at(-1)).toBe(cracked)
  expect(seen.opened).toEqual(['doomwheel'])
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /^Cracked$/ })).toBeDefined()
  expect(await pane.find({ text: /The wheel CRACKS!/ })).toBeDefined()
})

test('desktop: a PR closed unmerged is scrapped with no toast, notification or pane', async ($, on) => {
  const clock = mock.clock(on)
  const seen = watchUi(on)
  answerTools(on)
  answerGh(on, () => ({ shape: { state: 'CLOSED' } }))

  await $.tool.call(RAISE as never)
  await clock.settle()
  expect(seen.opened).toEqual(['doomwheel'])
  expect(seen.toasts).toEqual([])
  expect(seen.notified).toEqual([])
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /^Scrapped$/ })).toBeDefined()
})

for (const [name, gh] of [['missing', 'missing'], ['not signed in', { exitCode: 4, stderr: 'gh auth login' }]] as const) {
  test(`desktop: gh ${name} leaves one dim line on the card, and the wheel still turns on session signals`, async ($, on) => {
    const clock = mock.clock(on)
    const seen = watchUi(on)
    answerTools(on)
    answerGh(on, () => gh)

    await $.tool.call(RAISE as never)
    await $.tool.call(ARM as never)
    await clock.settle()

    expect(seen.notified).toEqual([])
    expect(seen.toasts).toEqual(['⚙ Doomwheel armed for #42'])
    const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
    expect(await pane.find({ text: /gh is missing or not signed in/ })).toBeDefined()
    expect(await pane.find({ text: /^Spinning$/ })).toBeDefined()
    expect(await pane.find({ text: /^—$/ })).toBeDefined()
  })
}

test('desktop: a ci-monitor-event wakes a wheel for its PR and polls it at once', async ($, on) => {
  const clock = mock.clock(on)
  const seen = watchUi(on)
  const gh = answerGh(on, () => ({ shape: { failing: 1 } }))

  await $.session.append({ door: 'delivery', message: { role: 'user', content: [{ type: 'text', text: CI_EVENT }] } } as never)
  await clock.settle()

  expect(seen.opened).toEqual(['doomwheel'])
  expect(gh.polls).toBe(1)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /^Warp-bolt!$/ })).toBeDefined()
  expect(await pane.find({ text: /The trial-pits run red/ })).toBeDefined()
})

test('desktop: event-shaped text in a tool result does not wake the wheel', async ($, on) => {
  watchUi(on)
  await $.session.append({
    door: 'tool-result',
    message: { role: 'user', content: [{ type: 'text', text: `<ci-monitor-event> is watching ${REPO} PR #7 and reports 1 CI check failed` }] },
  } as never).catch(() => undefined)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /The Doomwheel stands idle/ })).toBeDefined()
})

test('/doomwheel opens the pane; /doomwheel <url> adds that PR', async ($, on) => {
  const clock = mock.clock(on)
  const seen = watchUi(on)
  const gh = answerGh(on, () => ({ shape: {} }))

  const opened = await $.command.run({ command: 'doomwheel', args: '' } as never)
  expect((opened as { text?: string }).text).toBe('Doomwheel pane opened.')
  expect(seen.opened).toEqual(['doomwheel'])

  const added = await $.command.run({ command: 'doomwheel', args: PR_URL } as never)
  await clock.settle()
  expect((added as { text?: string }).text).toBe(`Doomwheel is tracking ${REPO}#42.`)
  expect(gh.polls).toBe(1)
  const pane = await $.ui.mount({ ...MOUNT, surface: 'desktop' })
  expect(await pane.find({ text: /The man-thing drags PR #42 before the wheel/ })).toBeDefined()
})
