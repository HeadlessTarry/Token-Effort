import { expect, test } from 'claude-code/testing'

import { FRAMES, drawFrame, mix, spriteSvg } from '../sprites'
import type { Kind } from '../../../types'

const KINDS: Kind[] = ['research', 'experiment', 'build', 'test', 'other']
const SVG_SOURCE_LIMIT = 131_072

test('every kind animates: at least one frame differs from the first', () => {
  for (const kind of KINDS) {
    const first = JSON.stringify(drawFrame(kind, 0))
    const differs = Array.from({ length: FRAMES }, (_, f) => JSON.stringify(drawFrame(kind, f))).some(frame => frame !== first)
    expect(differs, kind).toBe(true)
  }
})

test('a running rat is one SVG with a SMIL-switched layer per frame, within the Svg source limit', () => {
  for (const kind of KINDS) {
    const svg = spriteSvg(kind, 'running', 40)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.match(/<animate /g)?.length, kind).toBe(FRAMES)
    expect(svg.length, kind).toBeLessThan(SVG_SOURCE_LIMIT)
  }
})

test('a finished rat is frozen, grey and badged: ✓ green when done, ✕ red when failed', () => {
  const done = spriteSvg('build', 'done', 40)
  const failed = spriteSvg('test', 'failed', 40)
  expect(done).not.toContain('<animate')
  expect(done).toContain('fill="#5fbf5a"')
  expect(done).toContain('filter="url(#u-grey)"')
  expect(failed).toContain('filter="url(#u-grey)"')
  expect(spriteSvg('build', 'running', 40)).not.toContain('u-grey')
  const stopped = spriteSvg('build', 'stopped', 40)
  expect(stopped).toContain('filter="url(#u-grey)"')
  expect(stopped).toContain('fill="#d9a441"')
  expect(failed).toContain('fill="#e0574a"')
  expect(spriteSvg('build', 'running', 40)).not.toContain('<circle')
})

test('every rat sits on its own dark tile with its kind-coloured edge', () => {
  const svg = spriteSvg('research', 'running', 40)
  expect(svg).toContain('fill="url(#u-tile)"')
  expect(svg).toContain(`stroke="${mix('#b07cff', '#3d3a35', 0.45)}"`)
})

test('mix blends two colours', () => {
  expect(mix('#ffffff', '#000000', 0.5)).toBe('#808080')
  expect(mix('#ff0000', '#0000ff', 1)).toBe('#ff0000')
})

test('a running rat drawn still is one frame in its role colour, a fraction of the animated size', () => {
  for (const kind of KINDS) {
    const still = spriteSvg(kind, 'running', 40, false)
    expect(still).not.toContain('<animate')
    expect(still).not.toContain('u-grey')
    expect(still.length * 3, kind).toBeLessThan(spriteSvg(kind, 'running', 40).length)
  }
})
