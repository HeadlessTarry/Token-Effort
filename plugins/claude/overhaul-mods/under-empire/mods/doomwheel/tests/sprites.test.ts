import { expect, test } from 'claude-code/testing'

import { glyphOf, spinSeconds, wheelSvg } from '../sprites'
import type { Look } from '../sprites'
import type { Phase } from '../../../types'

const PHASES: Phase[] = ['offering', 'armed', 'waking', 'halted', 'disarmed', 'closed']
const SVG_SOURCE_LIMIT = 131_072
const look = (phase: Phase, extra: Partial<Look> = {}): Look => ({ phase, noise: 0, noiseLimit: 3, rounds: 0, roundLimit: 10, ...extra })

test('every look is one SVG within the Svg source limit', () => {
  for (const phase of PHASES) {
    for (const haltKind of ['noise', 'rounds'] as const) {
      const svg = wheelSvg(look(phase, { noise: 1, rounds: 8, haltKind }), 88)
      expect(svg.startsWith('<svg'), phase).toBe(true)
      expect(svg.length, phase).toBeLessThan(SVG_SOURCE_LIMIT)
    }
  }
})

test('the wheel turns only while Auto-fix is armed or a round is running', () => {
  expect(wheelSvg(look('armed'), 88)).toContain('type="rotate"')
  expect(wheelSvg(look('waking'), 88)).toContain('dur="1.1s"')
  for (const phase of ['offering', 'halted', 'disarmed', 'closed'] as const) {
    expect(wheelSvg(look(phase), 88), phase).not.toContain('type="rotate"')
  }
})

test('every round run slows the wheel, to two and a half times its fresh pace at the cap', () => {
  expect(spinSeconds(look('armed'))).toBe(4)
  expect(spinSeconds(look('armed', { rounds: 5 }))).toBe(7)
  expect(spinSeconds(look('armed', { rounds: 10 }))).toBe(10)
  expect(spinSeconds(look('halted', { rounds: 10 }))).toBeUndefined()
})

test('a tired rat sweats from round 7 of 10; a fresh one does not', () => {
  expect(wheelSvg(look('armed', { rounds: 6 }), 88)).not.toContain('#6fc3ff')
  expect(wheelSvg(look('armed', { rounds: 7 }), 88)).toContain('#6fc3ff')
})

test('a noise halt cracks and smokes; a round-cap halt leaves the wheel whole and the rat collapsed', () => {
  const overheated = wheelSvg(look('halted', { noise: 3, haltKind: 'noise' }), 88)
  const exhausted = wheelSvg(look('halted', { rounds: 10, haltKind: 'rounds' }), 88)
  expect(overheated).toContain('attributeName="cy"')
  expect(exhausted).not.toContain('attributeName="cy"')
  expect(exhausted).not.toContain('polyline points="18,24')
  expect(exhausted).toContain('rotate(12 33 54)')
  expect(exhausted).toContain('<ellipse cx="33" cy="56.2"')
  expect(glyphOf({ phase: 'halted', haltKind: 'rounds' })).toBe('🥵')
  expect(glyphOf({ phase: 'halted', haltKind: 'noise' })).toBe('💥')
})

test('a disarmed wheel goes grey', () => {
  expect(wheelSvg(look('disarmed'), 88)).toContain('filter="url(#dw-grey)"')
  expect(wheelSvg(look('armed'), 88)).not.toContain('dw-grey')
})

test('the crystal glows green when cool and red at the noise limit', () => {
  expect(wheelSvg(look('armed'), 88)).toContain('fill="#5fbf5a" stroke="#111"')
  expect(wheelSvg(look('armed', { noise: 3 }), 88)).toContain('fill="#e0574a" stroke="#111"')
})
