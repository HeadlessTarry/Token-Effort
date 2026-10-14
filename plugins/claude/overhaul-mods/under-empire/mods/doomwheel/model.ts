import type { HaltKind, LogEntry, LogKind, Offering, Phase } from '../../types'

// Pure logic: reads the signals the shepherding-pr-reviews skill and the desktop app's Auto-fix leave
// in a session (tool calls, their output, wake messages) and folds them into wheel state. Nothing
// here talks to the engine, so every rule is unit-testable.

/** The skill's script. Its name lives here alone: the skill owns it, and Doomwheel only reads its output. */
export const SKILL_SCRIPT = 'review-state.js'

export const LOG_LIMIT = 80
const DEFAULT_NOISE_LIMIT = 3
const DEFAULT_ROUND_LIMIT = 10
/** Share of the round cap after which the wheel-rat tires visibly. */
export const TIRED_SHARE = 0.7

const PR_URL_RE = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/
const REPO_PR_RE = /\b([\w.-]+\/[\w.-]+)#(\d+)\b/
const GH_PR_CREATE_RE = /\bgh\s+pr\s+create\b/
const SKILL_SCRIPT_RE = new RegExp(`${SKILL_SCRIPT.replace(/[.-]/g, '\\$&')}["']?\\s+([a-z-]+)`)
const REPO_ARG_RE = /--repo[\s=]+["']?([\w.-]+\/[\w.-]+)/
const PR_ARG_RE = /--pr[\s=]+["']?(\d+)/
const CI_EVENT_RE = /<ci-monitor-event>/
const CI_WATCHING_RE = /watching ([\w.-]+\/[\w.-]+) PR #(\d+)/
const CI_FAILED_RE = /(\d+) CI checks? failed/
const CI_COMMENTS_RE = /(\d+) new review comments?/
const CI_CONFLICT_RE = /merge conflict/i
const ANSI_CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g
const ANSI_OSC = /\u001b\][^\u0007\u001b]*(\u0007|\u001b\\)/g
const OTHER_ESCAPE = /\u001b[@-_]?/g
const CONTROL = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/g

export type Finding = { severity?: string | null }
export type IngestRound = { kind?: string; findings?: Finding[] }
export type IngestPlan = {
  action?: string
  instruction?: string | null
  noise_count?: number
  noise_limit?: number
  round_count?: number
  round_limit?: number
  rounds?: IngestRound[]
}
export type CheckReport = {
  ok?: boolean
  pr_state?: string
  threads?: unknown[]
  pm_comments?: unknown[]
  waiting_on_user?: unknown[]
  human_review_in_progress?: boolean
}

export type WheelEvent =
  | { type: 'raised'; repo: string; pr: number }
  | { type: 'monitor'; repo?: string; pr?: number; autoFix: boolean; denied?: string }
  | { type: 'wake'; repo: string; pr: number; failedChecks: number; newComments: number; conflict: boolean }
  | { type: 'ingest'; repo: string; pr: number; plan: IngestPlan }
  | { type: 'check'; repo: string; pr: number; report: CheckReport }
  | { type: 'reply'; resolved: boolean }
  | { type: 'wait'; repo: string; pr: number; waiting: number }
  | { type: 'continue'; repo: string; pr: number }
  | { type: 'turnEnd' }

export type Alert = { key: string; text: string; isUrgent: boolean }
/** `appeared` holds the keys of offerings this event made visible. */
export type Applied = { offerings: Offering[]; logs: LogEntry[]; alerts: Alert[]; appeared: string[] }

// ---------------------------------------------------------------- parsers

/** Every string inside a tool result, however deeply the tool nested it. */
export function textsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(textsIn)
  if (value && typeof value === 'object') return Object.values(value).flatMap(textsIn)
  return []
}

function repoPr(match: RegExpMatchArray | null): { repo: string; pr: number } | undefined {
  const repo = match?.[1]
  const pr = Number(match?.[2])
  return repo && Number.isInteger(pr) && pr > 0 ? { repo, pr } : undefined
}

export function parseJsonObject(text: string): Record<string, unknown> | undefined {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return undefined
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

/** A Bash or PowerShell call: `gh pr create` that printed its PR URL, or a subcommand of the skill's script. */
export function parseBash(command: string, output: string): WheelEvent | undefined {
  if (GH_PR_CREATE_RE.test(command)) {
    const created = repoPr(output.match(PR_URL_RE))
    return created ? { type: 'raised', ...created } : undefined
  }
  const sub = command.match(SKILL_SCRIPT_RE)?.[1]
  if (!sub) return undefined
  const payload = parseJsonObject(output)
  if (!payload) return undefined
  if (sub === 'reply') return { type: 'reply', resolved: payload.resolved === true }
  const repo = command.match(REPO_ARG_RE)?.[1]
  const pr = Number(command.match(PR_ARG_RE)?.[1])
  if (!repo || !Number.isInteger(pr) || pr <= 0) return undefined
  const target = { repo, pr }
  if (sub === 'ingest') return { type: 'ingest', ...target, plan: payload as IngestPlan }
  if (sub === 'check') return { type: 'check', ...target, report: payload as CheckReport }
  if (sub === 'continue') return { type: 'continue', ...target }
  if (sub === 'wait') {
    const waiting = Array.isArray(payload.waiting_on_user) ? payload.waiting_on_user.length : 0
    return { type: 'wait', ...target, waiting }
  }
  return undefined
}

/** A call to the desktop app's `set_monitor`: its input says on or off, its URL (or answer) says which PR. */
export function parseMonitor(input: Record<string, unknown>, resultText: string, denied?: string): WheelEvent | undefined {
  if (typeof input.auto_fix !== 'boolean') return undefined
  const url = typeof input.url === 'string' ? input.url : ''
  const target = repoPr(url.match(PR_URL_RE)) ?? repoPr(resultText.match(REPO_PR_RE))
  return { type: 'monitor', ...target, autoFix: input.auto_fix, denied }
}

/** A `<ci-monitor-event>` wake from the desktop app. */
export function parseCiEvent(text: string): WheelEvent | undefined {
  if (!CI_EVENT_RE.test(text)) return undefined
  const target = repoPr(text.match(CI_WATCHING_RE))
  if (!target) return undefined
  return {
    type: 'wake', ...target,
    failedChecks: Number(text.match(CI_FAILED_RE)?.[1] ?? 0),
    newComments: Number(text.match(CI_COMMENTS_RE)?.[1] ?? 0),
    conflict: CI_CONFLICT_RE.test(text),
  }
}

// ---------------------------------------------------------------- reducer

export function keyOf(repo: string, pr: number): string {
  return `${repo}#${pr}`
}

/** The offerings Doomwheel shows: those the skill has spoken for. The rest wait out of sight. */
export function visible(offerings: Offering[]): Offering[] {
  return offerings.filter(one => one.isShepherded)
}

/** A wheel gone cold (Auto-Fix off) or retired (PR merged or closed); Clear retired removes these. */
export function isRetired(one: Offering): boolean {
  return one.phase === 'closed' || one.phase === 'disarmed'
}

function fresh(repo: string, pr: number, at: number, phase: Phase, autoFix: boolean): Offering {
  return {
    key: keyOf(repo, pr), repo, pr, url: `https://github.com/${repo}/pull/${pr}`, phase, autoFix, isShepherded: false,
    noise: 0, noiseLimit: DEFAULT_NOISE_LIMIT, rounds: 0, roundLimit: DEFAULT_ROUND_LIMIT, waiting: 0,
    createdAt: at, updatedAt: at,
  }
}

function latestActive(offerings: Offering[]): Offering | undefined {
  return offerings.filter(one => one.phase !== 'closed').sort((a, b) => b.updatedAt - a.updatedAt)[0]
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function wakeReasons(failedChecks: number, newComments: number, conflict: boolean): string {
  const parts = []
  if (failedChecks) parts.push(`${plural(failedChecks, 'trial-pit')} failed`)
  if (newComments) parts.push(`${plural(newComments, 'new review comment')}`)
  if (conflict) parts.push('a merge conflict')
  return parts.length > 0 ? parts.join(', ') : 'something stirs'
}

function roundText(round: IngestRound, number: number, heat: string): { kind: LogKind; text: string } {
  const findings = round.findings ?? []
  const serious = findings.filter(f => f.severity === 'High' || f.severity === 'Medium').length
  if (round.kind === 'first') return { kind: 'round', text: `Round ${number}: the first scratchings — ${plural(findings.length, 'finding')}` }
  if (round.kind === 'human') return { kind: 'round', text: `Round ${number}: a man-thing reviews — ${plural(findings.length, 'finding')}` }
  if (round.kind === 'signal') return { kind: 'round', text: `Round ${number}: true warpstone — ${serious} High/Medium of ${plural(findings.length, 'finding')}` }
  if (round.kind === 'noise') return { kind: 'heat', text: `Round ${number}: Low-only chatter (${plural(findings.length, 'finding')}). Heat rises to ${heat}!` }
  if (round.kind === 'carry_over') return { kind: 'round', text: `Round ${number}: no new findings, old threads still squeak` }
  return { kind: 'round', text: `Round ${number}: quiet tunnels — nothing found` }
}

function haltReason(instruction: string | null | undefined): string {
  const first = (instruction ?? '').split('. ')[0]?.trim()
  return first || 'The watch is halted'
}

/** The skill checks the round cap before the noise limit, so its instruction names whichever won. */
export function haltKindOf(instruction: string | null | undefined): HaltKind {
  if (/^Round limit/.test(instruction ?? '')) return 'rounds'
  if (/^Noise limit/.test(instruction ?? '')) return 'noise'
  return 'other'
}

export function fatigue(rounds: number, roundLimit: number): number {
  return roundLimit > 0 ? Math.max(0, Math.min(1, rounds / roundLimit)) : 0
}

function tiredAt(roundLimit: number): number {
  return Math.ceil(roundLimit * TIRED_SHARE)
}

const HALT_LINES: Record<HaltKind, { log: string; alert: string }> = {
  noise: { log: 'OVERHEAT! {reason} — the wheel cracks!', alert: '🔥 Doomwheel overheated on #{pr}: {reason}. Your decision is needed.' },
  rounds: { log: 'EXHAUSTED! {reason} — the wheel-rat collapses mid-lap!', alert: '🥵 Doomwheel exhausted on #{pr}: {reason}. Your decision is needed.' },
  other: { log: 'HALT! {reason}', alert: '⛔ Doomwheel halted on #{pr}: {reason}. Your decision is needed.' },
}

function fill(template: string, reason: string, pr: number): string {
  return template.replace('{reason}', reason).replace('{pr}', String(pr))
}

class Fold {
  offerings: Offering[]
  readonly at: number
  logs: LogEntry[] = []
  alerts: Alert[] = []

  constructor(offerings: Offering[], at: number) {
    this.offerings = offerings
    this.at = at
  }

  find(key: string | undefined): Offering | undefined {
    return key ? this.offerings.find(one => one.key === key) : latestActive(visible(this.offerings))
  }

  ensure(repo: string, pr: number, phase: Phase, autoFix: boolean): Offering {
    const found = this.find(keyOf(repo, pr))
    if (found) return found
    const made = fresh(repo, pr, this.at, phase, autoFix)
    this.offerings = [...this.offerings, made]
    return made
  }

  /** The skill's script printed for this PR: from now on its wheel shows. */
  shepherd(repo: string, pr: number, phase: Phase, autoFix: boolean): Offering {
    const target = this.ensure(repo, pr, phase, autoFix)
    return target.isShepherded ? target : this.patch(target.key, { isShepherded: true })
  }

  patch(key: string, patch: Partial<Offering>): Offering {
    this.offerings = this.offerings.map(one => (one.key === key ? { ...one, ...patch, updatedAt: this.at } : one))
    return this.offerings.find(one => one.key === key) as Offering
  }

  log(key: string, kind: LogKind, text: string) {
    this.logs.push({ at: this.at, key, kind, text })
  }
}

function applyMonitor(fold: Fold, e: Extract<WheelEvent, { type: 'monitor' }>) {
  const target = e.repo && e.pr ? fold.ensure(e.repo, e.pr, 'offering', false) : fold.find(undefined)
  if (!target) return
  if (e.denied) {
    fold.log(target.key, 'warn', `The man-thing refused to ${e.autoFix ? 'arm' : 'cut'} the wheel`)
    return
  }
  if (e.autoFix) {
    fold.patch(target.key, { autoFix: true, phase: 'armed', haltReason: undefined, haltKind: undefined })
    fold.log(target.key, 'armed', 'The Doomwheel spins! Auto-fix armed — warp-lightning crackles')
    fold.alerts.push({ key: target.key, text: `⚙ Doomwheel armed for #${target.pr}`, isUrgent: false })
    return
  }
  const isHalted = target.phase === 'halted'
  fold.patch(target.key, { autoFix: false, phase: isHalted ? 'halted' : 'disarmed' })
  fold.log(target.key, 'disarmed', isHalted
    ? 'Auto-fix cut. The cracked wheel grinds to a stop — the man-thing must decide'
    : 'Auto-fix disarmed. The wheel-rats rest')
}

function applyIngest(fold: Fold, e: Extract<WheelEvent, { type: 'ingest' }>) {
  const { plan } = e
  const before = fold.shepherd(e.repo, e.pr, 'armed', true)
  const noiseLimit = plan.noise_limit ?? before.noiseLimit
  const now = fold.patch(before.key, {
    noise: plan.noise_count ?? before.noise, noiseLimit,
    rounds: plan.round_count ?? before.rounds, roundLimit: plan.round_limit ?? before.roundLimit,
  })
  // While the skill asks for severities or cannot parse a review, it records nothing, so its rounds are not yet rounds.
  const isRecorded = plan.action !== 'judge_severity' && plan.action !== 'format_drift'
  const rounds = isRecorded ? plan.rounds ?? [] : []
  const firstNumber = now.rounds - rounds.length + 1
  rounds.forEach((round, i) => {
    const line = roundText(round, firstNumber + i, `${now.noise}/${noiseLimit}`)
    fold.log(now.key, line.kind, line.text)
  })
  const tired = tiredAt(now.roundLimit)
  if (before.rounds < tired && now.rounds >= tired && now.rounds < now.roundLimit) {
    fold.log(now.key, 'tired', `The wheel-rat pants and sweats — round ${now.rounds}/${now.roundLimit}, ${plural(now.roundLimit - now.rounds, 'lap')} left`)
  }
  if (plan.action === 'halt') {
    if (before.phase === 'halted') return
    const reason = haltReason(plan.instruction)
    const kind = haltKindOf(plan.instruction)
    fold.patch(now.key, { phase: 'halted', haltReason: reason, haltKind: kind })
    fold.log(now.key, 'halt', fill(HALT_LINES[kind].log, reason, now.pr))
    fold.alerts.push({ key: now.key, text: fill(HALT_LINES[kind].alert, reason, now.pr), isUrgent: true })
  } else if (plan.action === 'copilot_error') {
    fold.log(now.key, 'warn', "Copilot's seer-stone cracked — re-request its review")
  } else if (plan.action === 'judge_severity') {
    fold.log(now.key, 'warn', "The reviewer's runes are smudged — judging severity by snout")
  } else if (plan.action === 'format_drift') {
    fold.log(now.key, 'warn', "Copilot's scrawl changed shape! The parser is confounded")
  } else if (plan.action === 'nothing' && rounds.length === 0) {
    fold.log(now.key, 'round', 'Nothing new to gnaw')
  }
}

function applyCheck(fold: Fold, e: Extract<WheelEvent, { type: 'check' }>) {
  const { report } = e
  const target = fold.shepherd(e.repo, e.pr, 'armed', true)
  if (report.pr_state && report.pr_state !== 'OPEN') {
    if (target.phase === 'closed') return
    fold.patch(target.key, { phase: 'closed', autoFix: false })
    fold.log(target.key, 'closed', `The offering is ${report.pr_state.toLowerCase()} — the wheel is retired`)
    return
  }
  if (report.human_review_in_progress) {
    fold.log(target.key, 'warn', 'The man-thing is mid-review — paws off until it is submitted')
    return
  }
  const open = (report.threads?.length ?? 0) + (report.pm_comments?.length ?? 0)
  const waiting = report.waiting_on_user?.length ?? target.waiting
  fold.patch(target.key, { openThreads: open, waiting })
  fold.log(target.key, open === 0 ? 'answered' : 'warn', open === 0
    ? 'Every thread answered — the Council is appeased'
    : `${plural(open, 'thread')} still squeak for answers`)
}

/**
 * Folds one event into the offerings; returns the new list, the log lines, the alerts it raised and
 * the offerings it made visible. An offering's alerts are dropped until the skill has spoken for it.
 */
export function apply(offerings: Offering[], e: WheelEvent, at: number): Applied {
  const fold = new Fold(offerings, at)
  switch (e.type) {
    case 'raised': {
      const made = fold.ensure(e.repo, e.pr, 'offering', false)
      fold.log(made.key, 'raised', `An offering is laid before the Council: PR #${e.pr}`)
      break
    }
    case 'monitor':
      applyMonitor(fold, e)
      break
    case 'wake': {
      const target = fold.ensure(e.repo, e.pr, 'armed', true)
      fold.patch(target.key, { phase: target.phase === 'halted' ? 'halted' : 'waking', autoFix: true })
      fold.log(target.key, 'wake', `Warp-bolt! The app squeaks: ${wakeReasons(e.failedChecks, e.newComments, e.conflict)}`)
      break
    }
    case 'ingest':
      applyIngest(fold, e)
      break
    case 'check':
      applyCheck(fold, e)
      break
    case 'reply': {
      const target = fold.find(undefined)
      if (target) fold.log(target.key, 'answered', e.resolved ? 'A thread answered and resolved' : 'A thread answered')
      break
    }
    case 'wait': {
      const target = fold.shepherd(e.repo, e.pr, 'armed', true)
      fold.patch(target.key, { waiting: e.waiting })
      fold.log(target.key, 'warn', `${plural(e.waiting, 'thread')} await the man-thing's judgement`)
      break
    }
    case 'continue': {
      const target = fold.shepherd(e.repo, e.pr, 'halted', false)
      fold.patch(target.key, { phase: 'waking', haltReason: undefined, haltKind: undefined })
      fold.log(target.key, 'round', 'The man-thing commands one more round — Auto-fix stays cut')
      break
    }
    case 'turnEnd':
      for (const one of fold.offerings.filter(o => o.phase === 'waking')) {
        fold.patch(one.key, { phase: one.autoFix ? 'armed' : 'disarmed' })
      }
      break
  }
  const wasVisible = new Set(visible(offerings).map(one => one.key))
  const shown = new Set(visible(fold.offerings).map(one => one.key))
  return {
    offerings: fold.offerings,
    logs: fold.logs,
    alerts: fold.alerts.filter(alert => shown.has(alert.key)),
    appeared: [...shown].filter(key => !wasVisible.has(key)),
  }
}

// ---------------------------------------------------------------- presentation

export const PHASES: Record<Phase, { label: string; mood: string; color: string }> = {
  offering: { label: 'Offering laid', mood: 'The wheel waits to be armed', color: '#d9a441' },
  armed: { label: 'Spinning', mood: 'Auto-fix armed — the wheel-rats run', color: '#7dff5a' },
  waking: { label: 'Warp-bolt!', mood: 'The app squeaked — a round is being gnawed', color: '#b8ff3a' },
  halted: { label: 'Overheated', mood: 'Halted — the man-thing must decide', color: '#e0574a' },
  disarmed: { label: 'Cold', mood: 'Auto-fix off — the wheel-rats rest', color: '#8c8984' },
  closed: { label: 'Retired', mood: 'The offering is merged or closed', color: '#8c8984' },
}

const HEAT_COLORS = ['#5fbf5a', '#e8c547', '#ff9a2e', '#e0574a']
export const EXHAUSTED_COLOR = '#d9a441'

/** Green when cool, red at the limit. */
export function heatColor(noise: number, limit: number): string {
  const share = limit > 0 ? Math.min(1, noise / limit) : 0
  return HEAT_COLORS[Math.round(share * (HEAT_COLORS.length - 1))] ?? '#5fbf5a'
}

/** Plain until the rat tires, then amber, then red at the cap. */
export function staminaColor(rounds: number, roundLimit: number): string | undefined {
  if (rounds >= roundLimit) return '#e0574a'
  return rounds >= tiredAt(roundLimit) ? EXHAUSTED_COLOR : undefined
}

/** A halt reads by the limit that caused it; every other phase by its own label. */
export function phaseLook(item: Pick<Offering, 'phase' | 'haltKind'>): { label: string; color: string } {
  if (item.phase === 'halted' && item.haltKind === 'rounds') return { label: 'Exhausted', color: EXHAUSTED_COLOR }
  if (item.phase === 'halted' && item.haltKind === 'other') return { label: 'Halted', color: PHASES.halted.color }
  return PHASES[item.phase]
}

export function pips(filled: number, total: number): string {
  const lit = Math.max(0, Math.min(total, filled))
  return '▰'.repeat(lit) + '▱'.repeat(Math.max(0, total - lit))
}

/** The pips gauge broken into rows of `perRow`, filled left-to-right, top-to-bottom. */
export function pipRows(filled: number, total: number, perRow: number): string[] {
  const gauge = pips(filled, total)
  const rows: string[] = []
  for (let start = 0; start < gauge.length; start += perRow) rows.push(gauge.slice(start, start + perRow))
  return rows
}

/** The line pinned under the prompt for the busiest visible offering; undefined when none is live. */
export function statusLine(offerings: Offering[]): string | undefined {
  const live = latestActive(visible(offerings))
  if (!live) return undefined
  return `⚙ Doomwheel #${live.pr} · ${phaseLook(live).label} · heat ${pips(live.noise, live.noiseLimit)} · round ${live.rounds}/${live.roundLimit}`
}

export function clock(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const LOG_GLYPHS: Record<LogKind, string> = {
  raised: '📜', armed: '⚙', disarmed: '❄', wake: '⚡', round: '🔁', heat: '🔥', tired: '💧', halt: '💥', answered: '✓', warn: '!', closed: '🏁',
}

/** Strips escape sequences and control characters, so text from GitHub or a tool cannot move the cursor or recolour the pane. */
export function sanitize(text: string): string {
  return text
    .replace(ANSI_OSC, '')
    .replace(ANSI_CSI, '')
    .replace(OTHER_ESCAPE, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(CONTROL, '')
}
