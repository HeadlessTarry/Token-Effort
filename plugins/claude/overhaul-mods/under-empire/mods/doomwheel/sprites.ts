import type { Phase } from '../../types'
import { PHASES, TIRED_LAPS, heatColor } from './model'

// The Doomwheel: a wooden wheel with a rat running inside it, powered by a warpstone crystal.
// One SVG per look, animated by SMIL, so the surface spins it without the plugin redrawing.
// The crystal glows with the PR's heat, and the rat tires as review laps pile up.

const CX = 32
const CY = 37
const RIM = 21
const TILE_BG = '#151413'
const WOOD = '#7a4e2a'
const WOOD_DARK = '#4a2e18'
const SPOKE = '#a87442'
/** The rat is drawn small and scaled up about its own feet, so it stays on the wheel's floor. */
const RAT_SCALE = 1.4
const RAT_FEET = [32, 54] as const
const IRON = '#5d6670'
const FUR = '#8a7a68'
const PINK = '#e09aa6'
const EYE = '#ff4433'
const BOLT = '#7dff5a'
const SMOKE = '#6a6770'
const SWEAT = '#6fc3ff'
const GOLD = '#ffc83d'
/** How far the wheel drops on a victory, to leave room for the rat standing on top. */
const VICTORY_DROP = 6
/** A fresh rat's seconds per turn; a rat worn right out turns the wheel this much slower again. */
const SPIN: Partial<Record<Phase, number>> = { armed: 4, waking: 1.1 }
const TIRED_SLOWDOWN = 1.5
/** Laps past the tired one over which the rat slows to its slowest. */
const TIRING_LAPS = 5

export type Look = {
  phase: Phase
  heat: number
  laps: number
}

type Pose = 'running' | 'idle' | 'asleep' | 'knockedOut'

/** Blends two `#rrggbb` colours: `amount` of `a` over `b`. */
export function mix(a: string, b: string, amount: number): string {
  const channel = (hex: string, i: number) => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2].map(i => Math.round(channel(a, i) * amount + channel(b, i) * (1 - amount)).toString(16).padStart(2, '0')).join('')}`
}

/** 0 for a fresh rat, rising from the tired lap to 1 a few laps later. */
export function fatigue(laps: number): number {
  if (laps < TIRED_LAPS) return 0
  return Math.min(1, (laps - TIRED_LAPS + 1) / TIRING_LAPS)
}

/** Seconds per turn of the wheel, slower once the rat tires; undefined when it stands still. */
export function spinSeconds(look: Look): number | undefined {
  const base = SPIN[look.phase]
  if (base === undefined) return undefined
  return Number((base * (1 + TIRED_SLOWDOWN * fatigue(look.laps))).toFixed(2))
}

function isTired(look: Look): boolean {
  return look.laps >= TIRED_LAPS
}

function poseOf(look: Look): Pose {
  if (look.phase === 'cracked') return 'knockedOut'
  if (look.phase === 'cold') return 'asleep'
  return spinSeconds(look) === undefined ? 'idle' : 'running'
}

function spokes(seconds: number | undefined): string {
  const lines = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4
    const x = (CX + Math.cos(angle) * (RIM - 2)).toFixed(2)
    const y = (CY + Math.sin(angle) * (RIM - 2)).toFixed(2)
    return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="${SPOKE}" stroke-width="1.8"/>`
  }).join('')
  const turn = seconds
    ? `<animateTransform attributeName="transform" type="rotate" from="0 ${CX} ${CY}" to="360 ${CX} ${CY}" dur="${seconds}s" repeatCount="indefinite"/>`
    : ''
  const rungs = `<circle cx="${CX}" cy="${CY}" r="${RIM - 2}" fill="none" stroke="${IRON}" stroke-width="0.8" stroke-dasharray="1.2 3.2"/>`
  return `<g>${lines}${rungs}<circle cx="${CX}" cy="${CY}" r="3" fill="${IRON}"/>${turn}</g>`
}

function rim(isCracked: boolean): string {
  const wood = `<circle cx="${CX}" cy="${CY}" r="${RIM}" fill="none" stroke="${WOOD}" stroke-width="3.6"/>`
  const band = `<circle cx="${CX}" cy="${CY}" r="${RIM}" fill="none" stroke="${IRON}" stroke-width="1" stroke-dasharray="2 5"/>`
  const cracks = isCracked
    ? `<polyline points="18,24 22,28 20,31 25,35" fill="none" stroke="#111" stroke-width="1.1"/><polyline points="45,47 41,44 43,41" fill="none" stroke="#111" stroke-width="1.1"/>`
    : ''
  const frame = `<polygon points="${CX - 9},63 ${CX},${CY} ${CX + 9},63" fill="none" stroke="${WOOD_DARK}" stroke-width="2"/>`
  return `${frame}${wood}${band}${cracks}`
}

function legs(isRunning: boolean): string {
  const a = `<path d="M29 53l-2 3M34 53l2 3" stroke="${FUR}" stroke-width="1.2"/>`
  const b = `<path d="M29 53l1 3M34 53l-1 3" stroke="${FUR}" stroke-width="1.2"/>`
  if (!isRunning) return a
  const flip = (values: string) => `<animate attributeName="visibility" values="${values}" dur="0.32s" calcMode="discrete" repeatCount="indefinite"/>`
  return `<g>${a}${flip('visible;hidden')}</g><g visibility="hidden">${b}${flip('hidden;visible')}</g>`
}

function eyeFor(pose: Pose): string {
  if (pose === 'knockedOut') return '<path d="M37.4 47.8l1.2 1.2M38.6 47.8l-1.2 1.2" stroke="#111" stroke-width="0.6"/>'
  if (pose === 'asleep') return '<path d="M37.4 48.6h1.3" stroke="#111" stroke-width="0.6"/>'
  return `<circle cx="38" cy="48.4" r="0.6" fill="${EYE}"/>`
}

/** Drops beading off a tired rat's brow. */
function sweat(): string {
  const drop = (x: number, y: number, begin: string) => `<path d="M${x} ${y}q-0.9 1.3 0 1.8q0.9-0.5 0-1.8z" fill="${SWEAT}" opacity="0">`
    + `<animate attributeName="opacity" values="0;1;0" dur="0.9s" begin="${begin}" repeatCount="indefinite"/>`
    + `<animateTransform attributeName="transform" type="translate" values="0 0;1.5 2.5" dur="0.9s" begin="${begin}" repeatCount="indefinite"/></path>`
  return `${drop(39.6, 44.2, '0s')}${drop(36.4, 43.4, '0.45s')}`
}

function rat(look: Look, pose: Pose): string {
  const isRunning = pose === 'running'
  const tail = `<path d="M27 52q-5 0-6-5" fill="none" stroke="${PINK}" stroke-width="1"/>`
  const body = `<ellipse cx="31.5" cy="51" rx="5" ry="3.1" fill="${FUR}"/>`
  const head = `<circle cx="37" cy="49" r="2.6" fill="${FUR}"/><circle cx="35.8" cy="46.6" r="1.1" fill="${PINK}"/><circle cx="39.4" cy="49.6" r="0.7" fill="${PINK}"/>`
  const bob = isRunning
    ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -0.7;0 0" dur="0.32s" repeatCount="indefinite"/>'
    : ''
  const snore = pose === 'asleep'
    ? `<text x="40" y="44" font-size="4" font-family="monospace" fill="#a8e4ff">z<animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite"/></text>`
    : ''
  const drops = isRunning && isTired(look) ? sweat() : ''
  const [fx, fy] = RAT_FEET
  const grow = `translate(${(fx * (1 - RAT_SCALE)).toFixed(1)} ${(fy * (1 - RAT_SCALE)).toFixed(1)}) scale(${RAT_SCALE})`
  return `<g transform="${grow}"><g>${tail}${legs(isRunning)}${body}${head}${eyeFor(pose)}${bob}</g>${drops}${snore}</g>`
}

function gem(x: number, y: number, fill: string): string {
  return `<polygon points="${x},${y - 5} ${x + 4},${y} ${x},${y + 5} ${x - 4},${y}" fill="${fill}" stroke="#111" stroke-width="0.6"/>`
    + `<polygon points="${x},${y - 3.5} ${x + 1.6},${y} ${x},${y + 2}" fill="#ffffff" opacity="0.35"/>`
}

function crystal(phase: Phase, heat: string): string {
  const mount = `<rect x="29" y="11.5" width="6" height="2.5" fill="${IRON}"/>`
  if (phase === 'offering' || phase === 'cold') return `${mount}${gem(32, 7, heat)}`
  const pulse = `<circle cx="32" cy="7" r="6" fill="${heat}" opacity="0.25"><animate attributeName="opacity" values="0.1;0.45;0.1" dur="1.4s" repeatCount="indefinite"/></circle>`
  return `${pulse}${mount}${gem(32, 7, heat)}`
}

function bolts(phase: Phase): string {
  if (phase !== 'armed' && phase !== 'waking') return ''
  const isWaking = phase === 'waking'
  const width = isWaking ? 1.4 : 0.9
  const flicker = (values: string, dur: string) => `<animate attributeName="opacity" values="${values}" dur="${dur}" repeatCount="indefinite"/>`
  const left = `<polyline points="29,9 22,12 25,14 15,20" fill="none" stroke="${BOLT}" stroke-width="${width}">${flicker('1;0.1;0.8;0;1', '0.7s')}</polyline>`
  const right = `<polyline points="35,9 42,12 39,15 49,21" fill="none" stroke="${BOLT}" stroke-width="${width}">${flicker('0;1;0.2;0.9;0', '0.9s')}</polyline>`
  if (!isWaking) return left + right
  const strike = `<polyline points="32,12 30,20 34,24 31,33" fill="none" stroke="#efffd0" stroke-width="1.6">${flicker('1;0;1;0;0;1', '0.5s')}</polyline>`
  const flash = `<rect x="0" y="0" width="64" height="64" fill="${BOLT}" opacity="0">${flicker('0;0.18;0;0;0.1;0', '1.1s')}</rect>`
  return left + right + strike + flash
}

function smoke(): string {
  const puff = (x: number, begin: string) => `<circle cx="${x}" cy="18" r="2" fill="${SMOKE}" opacity="0">`
    + `<animate attributeName="cy" values="18;1" dur="2.4s" begin="${begin}" repeatCount="indefinite"/>`
    + `<animate attributeName="r" values="1.5;5" dur="2.4s" begin="${begin}" repeatCount="indefinite"/>`
    + `<animate attributeName="opacity" values="0.7;0" dur="2.4s" begin="${begin}" repeatCount="indefinite"/></circle>`
  const flame = `<path d="M30 12q2-5 2-8q2 3 2 8z" fill="#ff9a2e"><animate attributeName="opacity" values="1;0.4;1" dur="0.4s" repeatCount="indefinite"/></path>`
  return flame + puff(26, '0s') + puff(36, '0.8s') + puff(31, '1.6s')
}

/** The rat stands upright on the still wheel's top, the warpstone held aloft in a gold blaze. */
function victory(): string {
  const top = CY - RIM + VICTORY_DROP
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4
    const x1 = (CX + Math.cos(angle) * 6).toFixed(2)
    const y1 = (6 + Math.sin(angle) * 6).toFixed(2)
    const x2 = (CX + Math.cos(angle) * 11).toFixed(2)
    const y2 = (6 + Math.sin(angle) * 11).toFixed(2)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-width="1"/>`
  }).join('')
  const blaze = `<circle cx="${CX}" cy="6" r="9" fill="${GOLD}" opacity="0.3"><animate attributeName="opacity" values="0.2;0.55;0.2" dur="1.6s" repeatCount="indefinite"/></circle>`
    + `<g opacity="0.8">${rays}<animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite"/></g>`
  const tail = `<path d="M31 ${top - 1}q-6 1-7 -4" fill="none" stroke="${PINK}" stroke-width="1"/>`
  const legs = `<path d="M30.5 ${top - 3}l-1 3M33.5 ${top - 3}l1 3" stroke="${FUR}" stroke-width="1.3"/>`
  const body = `<ellipse cx="${CX}" cy="${top - 6}" rx="3" ry="4" fill="${FUR}"/>`
  const head = `<circle cx="${CX}" cy="${top - 11.5}" r="2.5" fill="${FUR}"/><circle cx="30" cy="${top - 13.5}" r="1" fill="${PINK}"/><circle cx="34" cy="${top - 13.5}" r="1" fill="${PINK}"/>`
    + `<circle cx="31.2" cy="${top - 11.8}" r="0.5" fill="${EYE}"/><circle cx="32.8" cy="${top - 11.8}" r="0.5" fill="${EYE}"/>`
  const arms = `<path d="M30 ${top - 8}l-2 -6M34 ${top - 8}l2 -6" stroke="${FUR}" stroke-width="1.2"/>`
  return `${blaze}${tail}${legs}${body}${head}${arms}${gem(CX, 6, GOLD)}`
}

/** The wheel lies collapsed in a grey heap, its crystal dull, while the rat slinks off. */
function scrapped(): string {
  const heap = `<ellipse cx="26" cy="56" rx="17" ry="4" fill="none" stroke="${WOOD}" stroke-width="3"/>`
    + `<ellipse cx="26" cy="56" rx="17" ry="4" fill="none" stroke="${IRON}" stroke-width="1" stroke-dasharray="2 5"/>`
  const broken = '<path d="M14 52l9 -6M20 57l12 -9M30 53l8 -8M12 58l6 2" stroke="#a87442" stroke-width="1.6"/>'
  const dull = gem(24, 48, '#6b6a66')
  const slink = '<animateTransform attributeName="transform" type="translate" values="0 0;5 0" dur="3s" repeatCount="indefinite"/>'
    + '<animate attributeName="opacity" values="1;1;0" dur="3s" repeatCount="indefinite"/>'
  const rat = `<g><path d="M46 57q-4 1-6 -1" fill="none" stroke="${PINK}" stroke-width="0.9"/>`
    + `<ellipse cx="50" cy="57" rx="4" ry="2" fill="${FUR}"/><circle cx="54.5" cy="57.5" r="1.8" fill="${FUR}"/>`
    + `<circle cx="53.6" cy="55.8" r="0.8" fill="${PINK}"/><circle cx="55.2" cy="57.3" r="0.4" fill="${EYE}"/>${slink}</g>`
  return `${heap}${broken}${dull}${rat}`
}

const cache = new Map<string, string>()

/**
 * The wheel on its dark tile. It spins while Auto-fix is armed, slower once the rat tires, and
 * throws warp-lightning on a wake. The crystal glows green to red with the PR's heat. Cut with
 * work left, it cracks and smokes; cold, the rat sleeps. On a merge the rat stands on top holding
 * the warpstone aloft; closed unmerged, the wheel lies in a grey heap.
 */
export function wheelSvg(look: Look, sizePx: number): string {
  const heat = heatColor(look.heat)
  const pose = poseOf(look)
  const seconds = spinSeconds(look)
  const cacheKey = `${look.phase}:${pose}:${heat}:${seconds}:${isTired(look)}:${sizePx}`
  const hit = cache.get(cacheKey)
  if (hit) return hit
  const tone = PHASES[look.phase].color
  const glow = mix(tone, '#1a1918', 0.25)
  const edge = mix(tone, '#3d3a35', 0.5)
  const isGrey = look.phase === 'cold' || look.phase === 'scrapped'
  const filter = isGrey ? '<filter id="dw-grey"><feColorMatrix type="saturate" values="0.15"/></filter>' : ''
  const open = isGrey ? '<g filter="url(#dw-grey)" opacity="0.85">' : '<g>'
  const isCracked = pose === 'knockedOut'
  let scene: string
  if (look.phase === 'victory') {
    scene = `<g transform="translate(0 ${VICTORY_DROP})">${rim(false)}${spokes(undefined)}</g>${victory()}`
  } else if (look.phase === 'scrapped') {
    scene = scrapped()
  } else {
    scene = `${rim(isCracked)}${spokes(seconds)}${rat(look, pose)}${crystal(look.phase, heat)}${bolts(look.phase)}${isCracked ? smoke() : ''}`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${sizePx}" height="${sizePx}">`
    + `<defs><radialGradient id="dw-tile" cx="50%" cy="55%" r="70%"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${TILE_BG}"/></radialGradient>${filter}</defs>`
    + `<rect width="64" height="64" fill="${TILE_BG}"/><rect x="0.6" y="0.6" width="62.8" height="62.8" rx="5" fill="url(#dw-tile)" stroke="${edge}" stroke-width="1.2"/>`
    + `${open}${scene}</g></svg>`
  cache.set(cacheKey, svg)
  return svg
}

const GLYPHS: Record<Phase, string> = {
  offering: '📜', armed: '⚙', waking: '⚡', cracked: '💥', cold: '❄', victory: '🏆', scrapped: '🪦',
}

/** The wheel in a terminal, where no SVG draws. */
export function glyphOf(look: Pick<Look, 'phase'>): string {
  return GLYPHS[look.phase]
}
