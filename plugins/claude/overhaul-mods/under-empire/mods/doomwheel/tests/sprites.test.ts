import { expect, test } from 'claude-code/testing'

import { glyphOf, spinSeconds, wheelSvg } from '../sprites'
import type { Look } from '../sprites'
import type { Phase } from '../../../types'

const PHASES: Phase[] = ['offering', 'armed', 'waking', 'cracked', 'cold', 'victory', 'scrapped']
const SVG_SOURCE_LIMIT = 131_072
const look = (phase: Phase, extra: Partial<Look> = {}): Look => ({ phase, heat: 0, laps: 0, ...extra })

test('every look is one SVG within the Svg source limit', () => {
  for (const phase of PHASES) {
    const svg = wheelSvg(look(phase, { heat: 2, laps: 8 }), 88)
    expect(svg.startsWith('<svg'), phase).toBe(true)
    expect(svg.length, phase).toBeLessThan(SVG_SOURCE_LIMIT)
  }
})

test('the wheel turns only while Auto-fix is armed or a wake races it', () => {
  expect(wheelSvg(look('armed'), 88)).toContain('type="rotate"')
  expect(wheelSvg(look('waking'), 88)).toContain('dur="1.1s"')
  for (const phase of ['offering', 'cracked', 'cold', 'victory', 'scrapped'] as const) {
    expect(wheelSvg(look(phase), 88), phase).not.toContain('type="rotate"')
  }
})

test('the wheel slows from lap 7, to two and a half times its fresh pace', () => {
  expect(spinSeconds(look('armed', { laps: 6 }))).toBe(4)
  expect(spinSeconds(look('armed', { laps: 7 }))).toBe(5.2)
  expect(spinSeconds(look('armed', { laps: 30 }))).toBe(10)
  expect(spinSeconds(look('cracked', { laps: 10 }))).toBeUndefined()
})

test('a tired rat sweats from lap 7; a fresh one does not', () => {
  expect(wheelSvg(look('armed', { laps: 6 }), 88)).not.toContain('#6fc3ff')
  expect(wheelSvg(look('armed', { laps: 7 }), 88)).toContain('#6fc3ff')
})

test('a cracked wheel cracks and smokes', () => {
  const cracked = wheelSvg(look('cracked', { heat: 3 }), 88)
  expect(cracked).toContain('attributeName="cy"')
  expect(cracked).toContain('polyline points="18,24')
  expect(wheelSvg(look('armed'), 88)).not.toContain('polyline points="18,24')
})

test('victory holds the warpstone aloft in gold; scrapped lies grey in a heap while the rat slinks off', () => {
  const won = wheelSvg(look('victory'), 88)
  expect(won).toContain('#ffc83d')
  expect(won).toContain('translate(0 6)')
  const lost = wheelSvg(look('scrapped'), 88)
  expect(lost).toContain('filter="url(#dw-grey)"')
  expect(lost).toContain('values="0 0;5 0"')
  expect(glyphOf({ phase: 'victory' })).toBe('🏆')
  expect(glyphOf({ phase: 'scrapped' })).toBe('🪦')
  expect(glyphOf({ phase: 'cracked' })).toBe('💥')
})

test('a cold wheel goes grey', () => {
  expect(wheelSvg(look('cold'), 88)).toContain('filter="url(#dw-grey)"')
  expect(wheelSvg(look('armed'), 88)).not.toContain('dw-grey')
})

test('the crystal glows green when cool and red at heat 5', () => {
  expect(wheelSvg(look('armed'), 88)).toContain('fill="#5fbf5a" stroke="#111"')
  expect(wheelSvg(look('armed', { heat: 5 }), 88)).toContain('fill="#e0574a" stroke="#111"')
})
