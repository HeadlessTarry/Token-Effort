import type { Kind, Status } from '../../types'
import { ROLES } from './model'

// 24×24 Skaven, drawn procedurally per frame, then baked into one SVG whose frames SMIL switches,
// so the surface animates it without the plugin redrawing.

export const FRAMES = 12
export const FRAME_MS = 170
const N = 24

const PAL: Record<string, string> = {
  k: '#16110d', f: '#8a7a68', F: '#5e5045', p: '#e09aa6', w: '#efe6cf', e: '#ff4433',
  y: '#e8c547', o: '#ff9a2e', b: '#7a4e2a', B: '#4a2e18', g: '#7dff5a', G: '#2fbf1f', c: '#c27a3a',
  S: '#b4bcc6', s: '#5d6670', l: '#a8e4ff', r: '#5a3d26', m: '#24342a', a: '#8a3f22', d: '#2e3340', h: '#8f8f99',
  H: '#d9cfb0', q: '#6a6770', Q: '#cfcbd4', P: '#b07cff',
}

const HEAD = [
  '..kk........kk..',
  '.kppk......kppk.',
  '.kpppk....kpppk.',
  '.kppfkkkkkkfppk.',
  '..kffffffffffk..',
  '..kffffffffffk..',
  '.kfffeffffefffk.',
  '.kffffffffffffk.',
  '..kffffFFffffk..',
  '...kffFFFFffk...',
  '....kfFppFfk....',
  '.....kFwwFk.....',
  '......kwwk......',
  '.......kk.......',
]

type Grid = (string | null)[][]

function grid(): Grid {
  return Array.from({ length: N }, () => Array<string | null>(N).fill(null))
}
function put(g: Grid, x: number, y: number, c: string) {
  const row = g[y]
  if (row && x >= 0 && x < N) row[x] = c
}
function rect(g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(g, x, y, c)
}
function pts(g: Grid, list: ReadonlyArray<readonly [number, number]>, c: string) {
  for (const [x, y] of list) put(g, x, y, c)
}
function stamp(g: Grid, rows: readonly string[], ox: number, oy: number, recolor: Record<string, string> = {}) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') put(g, ox + x, oy + y, recolor[ch] ?? ch)
  }))
}

function body(g: Grid, robe: string, trim: string | null) {
  for (let y = 12; y < N; y++) {
    const w = Math.min(8, 3 + Math.floor((y - 12) * 0.7))
    for (let x = 12 - w; x <= 11 + w; x++) put(g, x, y, x === 12 - w || x === 11 + w ? 'k' : robe)
  }
  if (trim) rect(g, 6, 17, 17, 17, trim)
}
function tail(g: Grid, f: number) {
  const w = [0, 1, 0, -1][f % 4] ?? 0
  pts(g, [[5, 23], [4, 22], [3, 21], [2 + w, 20], [2 + w, 19], [3 + w, 18]], 'p')
}
function head(g: Grid, f: number, eye: string, recolor?: Record<string, string>) {
  stamp(g, HEAD, 4, 0, recolor)
  const blink = f === FRAMES - 1
  put(g, 9, 6, blink ? 'k' : eye)
  put(g, 14, 6, blink ? 'k' : eye)
  if (f % 6 === 3) put(g, 12, 10, 'k')
}

function greySeer(g: Grid, f: number) {
  tail(g, f); body(g, 'q', 'P'); head(g, f, f % 8 < 4 ? 'P' : 'e', { f: 'Q', F: 'h' })
  pts(g, [[4, 4], [3, 3], [2, 2], [2, 1], [3, 0], [4, 0], [3, 4]], 'H')
  pts(g, [[19, 4], [20, 3], [21, 2], [21, 1], [20, 0], [19, 0], [20, 4]], 'H')
  pts(g, [[2, 3], [21, 3]], 'B')
  rect(g, 20, 8, 21, 12, 'w'); rect(g, 19, 13, 22, 13, 'y')
  pts(g, [[20, 7], [21, 7], [f % 2 ? 21 : 20, 6]], 'o'); put(g, f % 2 ? 21 : 20, 5, 'y')
  rect(g, 6, 16, 17, 21, 'B'); rect(g, 7, 16, 16, 20, 'w'); rect(g, 11, 16, 12, 20, 'F')
  for (let i = 0; i <= (f >> 1) % 4; i++) rect(g, 8, 17 + i, 10, 17 + i, 'F')
  rect(g, 13, 17, 15, 17, 'F'); rect(g, 13, 19, 14, 19, 'F')
  if (f === 8) { rect(g, 13, 14, 16, 15, 'w'); rect(g, 13, 13, 16, 13, 'k') }
  if (f === 9) { rect(g, 11, 12, 13, 15, 'w'); rect(g, 11, 11, 13, 11, 'k') }
  if (f === 10) { rect(g, 8, 14, 10, 15, 'w'); rect(g, 7, 13, 10, 13, 'k') }
  pts(g, [[6, 18], [17, 18]], 'Q')
}

function apprentice(g: Grid, f: number) {
  tail(g, f); body(g, 'm', 'c'); head(g, f, 'g')
  rect(g, 6, 4, 17, 4, 'c')
  pts(g, [[9, 4], [10, 4], [13, 4], [14, 4]], f % 2 ? 'g' : 'G')
  rect(g, 18, 12, 21, 14, 'k'); rect(g, 19, 12, 20, 14, 'l')
  rect(g, 17, 15, 22, 15, 'k'); rect(g, 16, 16, 23, 20, 'k'); rect(g, 17, 21, 22, 21, 'k')
  rect(g, 17, 16, 22, 16, 'l'); rect(g, 17, 17, 22, 20, f % 4 < 2 ? 'G' : 'g')
  pts(g, [[18 + (f % 3), 18], [21 - (f % 2), 19]], f % 4 < 2 ? 'g' : 'G')
  for (let i = 0; i < 3; i++) {
    const y = 11 - ((f + i * 2) % 6) - 1
    if (y >= 3) put(g, 19 + (i % 2), y, 'g')
  }
  put(g, 16, 17, 'p')
  if (f < 2) pts(g, [[3, 2], [2, 3], [3, 4], [2, 5], [3, 6]], 'y')
}

function sapper(g: Grid, f: number) {
  tail(g, f); body(g, 'a', 'b'); head(g, f, 'e')
  rect(g, 9, 0, 14, 0, 'k'); rect(g, 8, 1, 15, 2, 'y'); rect(g, 7, 3, 16, 3, 'o')
  rect(g, 16, 20, 23, 20, 'S'); rect(g, 18, 21, 21, 22, 's'); rect(g, 16, 23, 23, 23, 'S')
  const phase = f % 4
  if (phase === 0) {
    rect(g, 19, 9, 19, 15, 'b'); rect(g, 17, 6, 21, 8, 'S'); rect(g, 17, 8, 21, 8, 's'); put(g, 19, 16, 'p')
  } else if (phase === 1) {
    pts(g, [[16, 16], [17, 15], [18, 14], [19, 13], [20, 12]], 'b'); rect(g, 19, 9, 22, 11, 'S'); put(g, 15, 16, 'p')
  } else {
    rect(g, 15, 17, 19, 17, 'b'); rect(g, 19, 16, 21, 19, 'S'); rect(g, 19, 19, 21, 19, 's'); put(g, 14, 17, 'p')
    const sparks: ReadonlyArray<readonly [number, number]> = phase === 2
      ? [[17, 18], [23, 18], [18, 15], [23, 16]]
      : [[16, 14], [23, 14], [22, 13], [17, 16]]
    pts(g, sparks, phase === 2 ? 'y' : 'o')
  }
}

const SWEEP = [8, 9, 10, 11, 10, 9]

function inspector(g: Grid, f: number) {
  tail(g, f); body(g, 'd', 'h'); head(g, f, 'e')
  pts(g, [[13, 5], [14, 5], [15, 5], [13, 7], [14, 7], [15, 7], [13, 6], [15, 6]], 'y')
  pts(g, [[16, 8], [16, 9], [17, 10], [17, 11]], 'y')
  rect(g, 5, 15, 14, 22, 'b'); rect(g, 6, 16, 13, 22, 'w'); rect(g, 8, 14, 11, 15, 'S')
  const ticked = Math.floor(f / 3) % 4
  ;[17, 19, 21].forEach((y, i) => { rect(g, 9, y, 12, y, 'F'); put(g, 7, y, i < ticked ? 'G' : 's') })
  const px = SWEEP[f % SWEEP.length] ?? 8
  pts(g, [[px - 1, 17], [px, 17], [px + 1, 17], [px - 1, 18], [px + 1, 18], [px - 1, 19], [px, 19], [px + 1, 19]], 's')
  put(g, px, 18, 'l')
  pts(g, [[px + 2, 20], [px + 3, 21]], 'b'); put(g, px + 4, 22, 'p')
}

function clanrat(g: Grid, f: number) {
  tail(g, f); body(g, 'r', null); head(g, f, 'e')
  const isUp = f % 4 < 2
  rect(g, 18, isUp ? 9 : 11, 18, isUp ? 15 : 17, 'S')
  put(g, 18, isUp ? 16 : 18, 'b'); put(g, 17, isUp ? 16 : 18, 'p')
}

const DRAW: Record<Kind, (g: Grid, f: number) => void> = {
  research: greySeer,
  experiment: apprentice,
  build: sapper,
  test: inspector,
  other: clanrat,
}

export function drawFrame(kind: Kind, frame: number): Grid {
  const g = grid()
  DRAW[kind](g, frame)
  return g
}

/** One `<path>` per colour, each horizontal run of a colour one `M x y h w v 1 h -w z`. */
export function toPaths(cells: ReadonlyMap<string, string>): string {
  const byColor = new Map<string, string[]>()
  for (let y = 0; y < N; y++) {
    let x = 0
    while (x < N) {
      const c = cells.get(`${x},${y}`)
      if (!c) { x++; continue }
      let end = x + 1
      while (end < N && cells.get(`${end},${y}`) === c) end++
      const runs = byColor.get(c) ?? []
      runs.push(`M${x} ${y}h${end - x}v1h-${end - x}z`)
      byColor.set(c, runs)
      x = end
    }
  }
  return [...byColor].map(([c, runs]) => `<path fill="${PAL[c]}" d="${runs.join('')}"/>`).join('')
}

function cellsOf(g: Grid): Map<string, string> {
  const cells = new Map<string, string>()
  g.forEach((row, y) => row.forEach((c, x) => { if (c) cells.set(`${x},${y}`, c) }))
  return cells
}

const cache = new Map<string, string>()

/**
 * The rat's SVG body (no outer `<svg>`): animated when running and `animate` is set, frozen on
 * frame 0 otherwise.
 */
export function spriteBody(kind: Kind, status: Status, animate = true): string {
  const isAnimated = status === 'running' && animate
  const cacheKey = `${kind}:${status}:${isAnimated}`
  const hit = cache.get(cacheKey)
  if (hit) return hit
  const frames = Array.from({ length: isAnimated ? FRAMES : 1 }, (_, f) => cellsOf(drawFrame(kind, f)))
  const first = frames[0] ?? new Map<string, string>()
  const common = new Map<string, string>([...first].filter(([at, c]) => frames.every(fr => fr.get(at) === c)))
  const dur = `${(FRAMES * FRAME_MS) / 1000}s`
  const keyTimes = Array.from({ length: FRAMES }, (_, i) => (i / FRAMES).toFixed(4)).join(';')
  const layers = frames.length === 1 ? '' : frames.map((fr, i) => {
    const own = new Map<string, string>([...fr].filter(([at]) => !common.has(at)))
    const values = Array.from({ length: FRAMES }, (_, j) => (j === i ? 'visible' : 'hidden')).join(';')
    return `<g visibility="${i === 0 ? 'visible' : 'hidden'}">${toPaths(own)}`
      + `<animate attributeName="visibility" values="${values}" keyTimes="${keyTimes}" calcMode="discrete" dur="${dur}" repeatCount="indefinite"/></g>`
  }).join('')
  const isFinished = status !== 'running'
  const filter = isFinished ? '<filter id="u-grey"><feColorMatrix type="saturate" values="0"/></filter>' : ''
  const wrapOpen = isFinished ? '<g filter="url(#u-grey)" opacity="0.8">' : '<g>'
  const svgBody = `${filter}${wrapOpen}${toPaths(common)}${layers}</g>`
  cache.set(cacheKey, svgBody)
  return svgBody
}

const TILE_BG = '#151413'
export const FINISHED_GREY = '#8c8984'
const OK = '#5fbf5a'
const BAD = '#e0574a'
const STOPPED = '#d9a441'

/** Blends two `#rrggbb` colours: `amount` of `a` over `b`. */
export function mix(a: string, b: string, amount: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2].map(i => Math.round(channel(a, i) * amount + channel(b, i) * (1 - amount)).toString(16).padStart(2, '0')).join('')}`
}

function badge(status: Status): string {
  if (status === 'done') {
    return `<circle cx="25.2" cy="25.2" r="3.4" fill="${OK}"/><path d="M23.6 25.3l1.1 1.1 2.2-2.4" fill="none" stroke="#111" stroke-width="0.9"/>`
  }
  if (status === 'stopped') {
    return `<circle cx="25.2" cy="25.2" r="3.4" fill="${STOPPED}"/><rect x="24" y="24" width="2.4" height="2.4" fill="#111"/>`
  }
  if (status === 'failed') {
    return `<circle cx="25.2" cy="25.2" r="3.4" fill="${BAD}"/><path d="M23.8 23.8l2.8 2.8M26.6 23.8l-2.8 2.8" stroke="#111" stroke-width="0.9"/>`
  }
  return ''
}

/**
 * The rat on its dark tile with the kind's coloured edge while it runs; once stopped, the rat and
 * tile turn grey and a coloured ✓, ✕ or ■ badge says how it ended.
 */
export function spriteSvg(kind: Kind, status: Status, sizePx: number, animate = true): string {
  const color = status === 'running' ? ROLES[kind].color : FINISHED_GREY
  const glow = mix(color, '#1a1918', 0.22)
  const edge = mix(color, '#3d3a35', 0.45)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="${sizePx}" height="${sizePx}">`
    + `<defs><radialGradient id="u-tile" cx="50%" cy="60%" r="75%"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${TILE_BG}"/></radialGradient></defs>`
    + `<rect x="0" y="0" width="30" height="30" fill="#151413"/><rect x="0.4" y="0.4" width="29.2" height="29.2" rx="3" fill="url(#u-tile)" stroke="${edge}" stroke-width="0.8"/>`
    + `<svg x="3" y="3" width="${N}" height="${N}" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${spriteBody(kind, status, animate)}</svg>`
    + `${badge(status)}</svg>`
}
