import { expect, test } from 'claude-code/testing'

import { apply, parseBash } from '../model'
import type { WheelEvent } from '../model'
import type { Offering } from '../../../types'
import {
  CHECK_HUMAN_REVIEWING, CHECK_MERGED, CHECK_OPEN, INGEST_HANDLE, INGEST_NOISE_HALT, INGEST_ROUND_HALT, PR, REPO, scriptCommand,
} from './fixtures'

// Each test reads one contract field through the parser, as the script prints it, and shows the
// wheel moving with it. A renamed or reshaped field in fixtures.ts makes the matching test fail.

function read(subcommand: string, output: object): WheelEvent {
  const event = parseBash(scriptCommand(subcommand), JSON.stringify(output, null, 2))
  expect(event, subcommand).toBeDefined()
  return event as WheelEvent
}

function fold(events: WheelEvent[]) {
  let offerings: Offering[] = []
  const logs: string[] = []
  const alerts: string[] = []
  events.forEach((event, i) => {
    const applied = apply(offerings, event, 1_000 + i)
    offerings = applied.offerings
    logs.push(...applied.logs.map(entry => entry.text))
    alerts.push(...applied.alerts.map(alert => alert.text))
  })
  return { wheel: offerings[0] as Offering, logs, alerts }
}

test('the script and its --repo/--pr options name the PR', () => {
  expect(read('ingest', INGEST_HANDLE)).toMatchObject({ type: 'ingest', repo: REPO, pr: PR })
  expect(read('check', CHECK_OPEN)).toMatchObject({ type: 'check', repo: REPO, pr: PR })
})

test('ingest: noise_count, noise_limit, round_count and round_limit fill the gauges', () => {
  const { wheel } = fold([read('ingest', INGEST_HANDLE)])
  expect(wheel.noise).toBe(INGEST_HANDLE.noise_count)
  expect(wheel.noiseLimit).toBe(INGEST_HANDLE.noise_limit)
  expect(wheel.rounds).toBe(INGEST_HANDLE.round_count)
  expect(wheel.roundLimit).toBe(INGEST_HANDLE.round_limit)
})

test('ingest: rounds[].kind and rounds[].findings[].severity tell the squeak-scroll what each round was', () => {
  expect(fold([read('ingest', INGEST_HANDLE)]).logs).toContain('Round 3: true warpstone — 1 High/Medium of 2 findings')
  expect(fold([read('ingest', INGEST_NOISE_HALT)]).logs).toContain('Round 4: Low-only chatter (1 finding). Heat rises to 3/3!')
})

test('ingest: action halt with a Noise limit instruction overheats the wheel', () => {
  const { wheel, alerts } = fold([read('ingest', INGEST_NOISE_HALT)])
  expect(wheel.phase).toBe('halted')
  expect(wheel.haltKind).toBe('noise')
  expect(wheel.haltReason).toBe('Noise limit (3 noise rounds) reached')
  expect(alerts).toEqual([`🔥 Doomwheel overheated on #${PR}: Noise limit (3 noise rounds) reached. Your decision is needed.`])
})

test('ingest: action halt with a Round limit instruction exhausts the rat', () => {
  const { wheel } = fold([read('ingest', INGEST_ROUND_HALT)])
  expect(wheel.phase).toBe('halted')
  expect(wheel.haltKind).toBe('rounds')
  expect(wheel.haltReason).toBe('Round limit (10 rounds) reached')
})

test('check: threads, pm_comments and waiting_on_user count what is still open', () => {
  const { wheel, logs } = fold([read('check', CHECK_OPEN)])
  expect(wheel.openThreads).toBe(CHECK_OPEN.threads.length + CHECK_OPEN.pm_comments.length)
  expect(wheel.waiting).toBe(CHECK_OPEN.waiting_on_user.length)
  expect(logs).toEqual(['3 threads still squeak for answers'])
})

test('check: human_review_in_progress holds the wheel, and pr_state retires it', () => {
  expect(fold([read('check', CHECK_HUMAN_REVIEWING)]).logs).toEqual(['The man-thing is mid-review — paws off until it is submitted'])
  expect(fold([read('check', CHECK_MERGED)]).wheel.phase).toBe('closed')
})
