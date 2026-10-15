import type { LogEntry, LogKind, Offering, Phase } from '../../types'

// Pure logic: reads the signals a session leaves about its PRs (tool calls, their output, wake
// messages) and what GitHub says when polled, and folds them into wheel state. Nothing here talks
// to the engine, so every rule is unit-testable.

export const LOG_LIMIT = 80
/** Heat at which the crystal glows red. Cosmetic: nothing halts there. */
export const HEAT_LIMIT = 5
/** The lap from which the wheel slows and the rat sweats. Cosmetic: nothing halts there. */
export const TIRED_LAPS = 7
/** More new reviews than this in one poll are logged as one line, not one each. */
const REVIEW_LINES_LIMIT = 3

const PR_URL_RE = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/
const REPO_PR_RE = /\b([\w.-]+\/[\w.-]+)#(\d+)\b/
const GH_RE = /(^|[\s;&|(])gh(\.exe)?\s/
const GH_PR_CREATE_RE = /\bgh\s+pr\s+create\b/
const CI_EVENT_RE = /<ci-monitor-event>/
const CI_WATCHING_RE = /watching ([\w.-]+\/[\w.-]+) PR #(\d+)/
const CI_FAILED_RE = /(\d+) CI checks? failed/
const CI_COMMENTS_RE = /(\d+) new review comments?/
const CI_CONFLICT_RE = /merge conflict/i
/** What `gh` prints when it has no usable login. */
const GH_AUTH_RE = /gh auth login|not logged in|authentication|GH_TOKEN/i
/** `gh` exits 4 when authentication is needed. */
const GH_AUTH_EXIT = 4
const FAILED_CONCLUSIONS = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE'])
const FAILED_STATES = new Set(['FAILURE', 'ERROR'])
const ANSI_CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g
const ANSI_OSC = /\u001b\][^\u0007\u001b]*(\u0007|\u001b\\)/g
const OTHER_ESCAPE = /\u001b[@-_]?/g
const CONTROL = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/g

/** One poll of a PR on GitHub: everything the gauges and phases are drawn from. */
export type Snapshot = {
  state: 'OPEN' | 'MERGED' | 'CLOSED'
  /** Submitted reviews, oldest first. */
  reviews: Array<{ author: string; state: string }>
  unresolvedThreads: number
  totalThreads: number
  failingChecks: number
  conflict: boolean
}

export type WheelEvent =
  | { type: 'raised'; repo: string; pr: number }
  | { type: 'added'; repo: string; pr: number }
  | { type: 'monitor'; repo?: string; pr?: number; autoFix: boolean; denied?: string }
  | { type: 'wake'; repo: string; pr: number; failedChecks: number; newComments: number; conflict: boolean }
  | { type: 'poll'; repo: string; pr: number; snapshot: Snapshot }
  | { type: 'ghUnavailable'; repo: string; pr: number }
  | { type: 'turnEnd' }

/** `notify` also raises a native notification; `openPane` brings the pane up. */
export type Alert = { key: string; text: string; notify: boolean; openPane: boolean }
/** `appeared` holds the keys of offerings this event created. */
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

/** A PR named as its URL or as `owner/name#N`, as `/doomwheel <url>` takes it. */
export function parsePrRef(text: string): { repo: string; pr: number } | undefined {
  return repoPr(text.match(PR_URL_RE)) ?? repoPr(text.match(REPO_PR_RE))
}

/** A Bash or PowerShell call: `gh pr create` that printed its PR URL. */
export function parseBash(command: string, output: string): WheelEvent | undefined {
  if (!GH_PR_CREATE_RE.test(command)) return undefined
  const created = repoPr(output.match(PR_URL_RE))
  return created ? { type: 'raised', ...created } : undefined
}

/** The tracked offerings a `gh` command names, by URL, `owner/name#N` or a bare PR number. */
export function ghTouches(command: string, offerings: Offering[]): string[] {
  if (!GH_RE.test(` ${command}`)) return []
  return offerings
    .filter(one => command.includes(one.url) || command.includes(one.key)
      || new RegExp(`(^|[\\s/#'"=])${one.pr}($|[\\s'"/])`).test(command))
    .map(one => one.key)
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

// ---------------------------------------------------------------- polling

const PR_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      state
      mergeable
      reviews(first: 100) { nodes { state author { login } } }
      reviewThreads(first: 100) { totalCount nodes { isResolved } }
      commits(last: 1) { nodes { commit { statusCheckRollup { contexts(first: 100) {
        nodes { __typename ... on CheckRun { conclusion } ... on StatusContext { state } }
      } } } } }
    }
  }
}`

/** The one `gh` call a poll makes: the PR's state, reviews, threads, checks and mergeability. */
export function pollArgv(repo: string, pr: number): string[] {
  const [owner = '', name = ''] = repo.split('/')
  return ['gh', 'api', 'graphql', '-f', `query=${PR_QUERY}`, '-F', `owner=${owner}`, '-F', `name=${name}`, '-F', `number=${pr}`]
}

type Nodes<T> = { nodes?: Array<T | null> | null } | null | undefined

function nodes<T>(list: Nodes<T>): T[] {
  return (list?.nodes ?? []).filter((one): one is T => one !== null && one !== undefined)
}

/** Reads the GraphQL answer `pollArgv` asks for; undefined when it is not one. */
export function parseSnapshot(stdout: string): Snapshot | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch {
    return undefined
  }
  type Pull = {
    state?: string
    mergeable?: string
    reviews?: Nodes<{ state?: string; author?: { login?: string } | null }>
    reviewThreads?: { totalCount?: number } & Nodes<{ isResolved?: boolean }>
    commits?: Nodes<{ commit?: { statusCheckRollup?: { contexts?: Nodes<{ conclusion?: string | null; state?: string }> } | null } }>
  }
  const pull = (parsed as { data?: { repository?: { pullRequest?: Pull | null } | null } })?.data?.repository?.pullRequest
  if (!pull || (pull.state !== 'OPEN' && pull.state !== 'MERGED' && pull.state !== 'CLOSED')) return undefined
  const reviews = nodes(pull.reviews)
    .filter(review => review.state !== 'PENDING')
    .map(review => ({ author: review.author?.login ?? 'ghost', state: review.state ?? 'COMMENTED' }))
  const threads = nodes(pull.reviewThreads)
  const contexts = nodes(nodes(pull.commits)[0]?.commit?.statusCheckRollup?.contexts)
  return {
    state: pull.state,
    reviews,
    unresolvedThreads: threads.filter(thread => !thread.isResolved).length,
    totalThreads: pull.reviewThreads?.totalCount ?? threads.length,
    failingChecks: contexts.filter(check => FAILED_CONCLUSIONS.has(check.conclusion ?? '') || FAILED_STATES.has(check.state ?? '')).length,
    conflict: pull.mergeable === 'CONFLICTING',
  }
}

/**
 * What one poll's `gh` run says: a snapshot, or that `gh` has no login. Any other failure says
 * nothing, and the next poll tries again. A `gh` that cannot start at all is the caller's to report.
 */
export function readPoll(repo: string, pr: number, ran: { exitCode: number; stdout: string; stderr: string }): WheelEvent | undefined {
  if (ran.exitCode === 0) {
    const snapshot = parseSnapshot(ran.stdout)
    return snapshot ? { type: 'poll', repo, pr, snapshot } : undefined
  }
  if (ran.exitCode === GH_AUTH_EXIT || GH_AUTH_RE.test(ran.stderr)) return { type: 'ghUnavailable', repo, pr }
  return undefined
}

// ---------------------------------------------------------------- reducer

export function keyOf(repo: string, pr: number): string {
  return `${repo}#${pr}`
}

/** A wheel whose PR is merged or closed; polling stops and Clear retired removes it. */
export function isRetired(one: Pick<Offering, 'phase'>): boolean {
  return one.phase === 'victory' || one.phase === 'scrapped'
}

/** Unresolved review threads, failing checks, and one for a merge conflict. */
export function heatOf(one: Pick<Offering, 'unresolvedThreads' | 'failingChecks' | 'conflict'>): number {
  return one.unresolvedThreads + one.failingChecks + (one.conflict ? 1 : 0)
}

function hasOpenWork(one: Offering): boolean {
  return heatOf(one) > 0
}

/** An offering as stored, with any field an older Doomwheel never wrote filled in. */
export function revive(one: Offering): Offering {
  return {
    ...one,
    phase: one.phase in PHASES ? one.phase : 'cold',
    laps: one.laps ?? 0,
    unresolvedThreads: one.unresolvedThreads ?? 0,
    totalThreads: one.totalThreads ?? 0,
    failingChecks: one.failingChecks ?? 0,
    conflict: one.conflict ?? false,
  }
}

function fresh(repo: string, pr: number, at: number, phase: Phase, autoFix: boolean): Offering {
  return {
    key: keyOf(repo, pr), repo, pr, url: `https://github.com/${repo}/pull/${pr}`, phase, autoFix,
    laps: 0, unresolvedThreads: 0, totalThreads: 0, failingChecks: 0, conflict: false,
    createdAt: at, updatedAt: at,
  }
}

function latestLive(offerings: Offering[]): Offering | undefined {
  return offerings.filter(one => !isRetired(one)).sort((a, b) => b.updatedAt - a.updatedAt)[0]
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

const REVIEW_WORDS: Record<string, string> = {
  APPROVED: 'approves', CHANGES_REQUESTED: 'demands changes', COMMENTED: 'comments', DISMISSED: 'was dismissed',
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
    return key ? this.offerings.find(one => one.key === key) : latestLive(this.offerings)
  }

  ensure(repo: string, pr: number, phase: Phase, autoFix: boolean): Offering {
    const found = this.find(keyOf(repo, pr))
    if (found) return found
    const made = fresh(repo, pr, this.at, phase, autoFix)
    this.offerings = [...this.offerings, made]
    return made
  }

  patch(key: string, patch: Partial<Offering>): Offering {
    this.offerings = this.offerings.map(one => (one.key === key ? { ...one, ...patch, updatedAt: this.at } : one))
    return this.offerings.find(one => one.key === key) as Offering
  }

  log(key: string, kind: LogKind, text: string) {
    this.logs.push({ at: this.at, key, kind, text })
  }

  alert(key: string, text: string, notify: boolean, openPane: boolean) {
    this.alerts.push({ key, text, notify, openPane })
  }

  crack(one: Offering) {
    this.patch(one.key, { phase: 'cracked' })
    this.log(one.key, 'crack', `The wheel CRACKS! Auto-fix cut with ${plural(heatOf(one), 'wound')} still open`)
    this.alert(one.key, `💥 Doomwheel cracked on #${one.pr}: Auto-fix is off with work left. Your decision is needed.`, true, true)
  }
}

function applyMonitor(fold: Fold, e: Extract<WheelEvent, { type: 'monitor' }>) {
  const target = e.repo && e.pr ? fold.ensure(e.repo, e.pr, 'offering', false) : fold.find(undefined)
  if (!target) return
  if (e.denied) {
    fold.log(target.key, 'warn', `The man-thing refused to ${e.autoFix ? 'arm' : 'cut'} the wheel`)
    return
  }
  if (isRetired(target)) {
    fold.patch(target.key, { autoFix: e.autoFix })
    return
  }
  if (e.autoFix) {
    fold.patch(target.key, { autoFix: true, phase: 'armed' })
    fold.log(target.key, 'armed', 'The Doomwheel spins! Auto-fix armed — warp-lightning crackles')
    fold.alert(target.key, `⚙ Doomwheel armed for #${target.pr}`, false, false)
    return
  }
  const cut = fold.patch(target.key, { autoFix: false })
  fold.log(cut.key, 'disarmed', 'Auto-fix cut')
  if (hasOpenWork(cut)) {
    if (cut.phase !== 'cracked') fold.crack(cut)
  } else {
    fold.patch(cut.key, { phase: 'cold' })
    fold.log(cut.key, 'disarmed', 'No wounds left open — the wheel-rats rest')
  }
}

function logChanges(fold: Fold, before: Offering, after: Snapshot) {
  const { key } = before
  const newReviews = after.reviews.slice(before.laps)
  if (newReviews.length > REVIEW_LINES_LIMIT) {
    fold.log(key, 'review', `${plural(newReviews.length, 'review')} submitted — lap ${after.reviews.length}`)
  } else {
    newReviews.forEach((review, i) => {
      const lap = before.laps + i + 1
      fold.log(key, 'review', `${review.author} ${REVIEW_WORDS[review.state] ?? review.state.toLowerCase()} — lap ${lap}`)
      if (lap === TIRED_LAPS) fold.log(key, 'tired', `The wheel-rat pants and sweats — lap ${lap}`)
    })
  }
  if (after.unresolvedThreads > before.unresolvedThreads) {
    fold.log(key, 'threads', `Unresolved threads rise to ${after.unresolvedThreads}/${after.totalThreads}`)
  } else if (after.unresolvedThreads < before.unresolvedThreads) {
    fold.log(key, 'threads', after.unresolvedThreads === 0
      ? 'Every thread resolved — the Council is appeased'
      : `Unresolved threads fall to ${after.unresolvedThreads}/${after.totalThreads}`)
  }
  if (after.failingChecks > 0 && before.failingChecks === 0) {
    fold.log(key, 'checks', `The trial-pits run red: ${plural(after.failingChecks, 'failing check')}`)
  } else if (after.failingChecks === 0 && before.failingChecks > 0) {
    fold.log(key, 'checks', 'The trial-pits recover — all green')
  }
  if (after.conflict && !before.conflict) fold.log(key, 'conflict', 'A merge conflict! Rival tunnels collide')
  else if (!after.conflict && before.conflict) fold.log(key, 'conflict', 'The merge conflict is cleared')
}

function applyPoll(fold: Fold, e: Extract<WheelEvent, { type: 'poll' }>) {
  const before = fold.ensure(e.repo, e.pr, 'offering', false)
  if (isRetired(before)) return
  const { snapshot } = e
  logChanges(fold, before, snapshot)
  const now = fold.patch(before.key, {
    laps: snapshot.reviews.length, unresolvedThreads: snapshot.unresolvedThreads, totalThreads: snapshot.totalThreads,
    failingChecks: snapshot.failingChecks, conflict: snapshot.conflict, polledAt: fold.at, ghUnavailable: undefined,
  })
  if (snapshot.state === 'MERGED') {
    fold.patch(now.key, { phase: 'victory' })
    fold.log(now.key, 'victory', 'VICTORY! The offering is merged — the warpstone is ours!')
    fold.alert(now.key, `🏆 Doomwheel victory: #${now.pr} is merged`, false, true)
  } else if (snapshot.state === 'CLOSED') {
    fold.patch(now.key, { phase: 'scrapped' })
    fold.log(now.key, 'scrapped', 'Scrapped. The offering is closed unmerged — the wheel collapses')
  } else if (now.phase === 'cracked' && !hasOpenWork(now)) {
    fold.patch(now.key, { phase: 'cold' })
    fold.log(now.key, 'disarmed', 'The last wound closes — the cracked wheel cools')
  }
}

/** Folds one event into the offerings; returns the new list, the log lines, the alerts and the offerings it created. */
export function apply(offerings: Offering[], e: WheelEvent, at: number): Applied {
  const fold = new Fold(offerings, at)
  switch (e.type) {
    case 'raised': {
      const made = fold.ensure(e.repo, e.pr, 'offering', false)
      fold.log(made.key, 'raised', `An offering is laid before the Council: PR #${e.pr}`)
      break
    }
    case 'added': {
      const known = fold.find(keyOf(e.repo, e.pr))
      if (known) break
      const made = fold.ensure(e.repo, e.pr, 'offering', false)
      fold.log(made.key, 'raised', `The man-thing drags PR #${e.pr} before the wheel`)
      break
    }
    case 'monitor':
      applyMonitor(fold, e)
      break
    case 'wake': {
      const target = fold.ensure(e.repo, e.pr, 'armed', true)
      if (!isRetired(target)) fold.patch(target.key, { phase: 'waking', autoFix: true })
      fold.log(target.key, 'wake', `Warp-bolt! The app squeaks: ${wakeReasons(e.failedChecks, e.newComments, e.conflict)}`)
      break
    }
    case 'poll':
      applyPoll(fold, e)
      break
    case 'ghUnavailable': {
      const target = fold.find(keyOf(e.repo, e.pr))
      if (target && !target.ghUnavailable) fold.patch(target.key, { ghUnavailable: true })
      break
    }
    case 'turnEnd':
      for (const one of fold.offerings.filter(o => o.phase === 'waking')) {
        fold.patch(one.key, { phase: one.autoFix ? 'armed' : 'cold' })
      }
      break
  }
  const known = new Set(offerings.map(one => one.key))
  return {
    offerings: fold.offerings,
    logs: fold.logs,
    alerts: fold.alerts,
    appeared: fold.offerings.map(one => one.key).filter(key => !known.has(key)),
  }
}

// ---------------------------------------------------------------- presentation

export const PHASES: Record<Phase, { label: string; mood: string; color: string }> = {
  offering: { label: 'Offering laid', mood: 'The wheel waits to be armed', color: '#d9a441' },
  armed: { label: 'Spinning', mood: 'Auto-fix armed — the wheel-rats run', color: '#7dff5a' },
  waking: { label: 'Warp-bolt!', mood: 'The app squeaked — the wheel races', color: '#b8ff3a' },
  cracked: { label: 'Cracked', mood: 'Auto-fix cut with work left — the man-thing must decide', color: '#e0574a' },
  cold: { label: 'Cold', mood: 'Auto-fix off — the wheel-rats rest', color: '#8c8984' },
  victory: { label: 'Victory', mood: 'Merged — the warpstone is held aloft', color: '#ffc83d' },
  scrapped: { label: 'Scrapped', mood: 'Closed unmerged — the wheel lies in a heap', color: '#8c8984' },
}

const HEAT_COLORS = ['#5fbf5a', '#e8c547', '#ff9a2e', '#e0574a']
const TIRED_COLOR = '#d9a441'
const GOOD = '#5fbf5a'
const BAD = '#e0574a'

/** Crystal green when cool, red at `HEAT_LIMIT` or more. */
export function heatColor(heat: number): string {
  const share = Math.min(1, Math.max(0, heat) / HEAT_LIMIT)
  return HEAT_COLORS[Math.round(share * (HEAT_COLORS.length - 1))] ?? GOOD
}

/** Plain until the rat tires, then amber. */
export function lapsColor(laps: number): string | undefined {
  return laps >= TIRED_LAPS ? TIRED_COLOR : undefined
}

/** `unresolved/total`, red while any is unresolved, green at none; a dash until the first poll. */
export function threadsGauge(one: Offering): { text: string; color?: string } {
  if (one.polledAt === undefined) return { text: '—' }
  return { text: `${one.unresolvedThreads}/${one.totalThreads}`, color: one.unresolvedThreads > 0 ? BAD : GOOD }
}

export function pips(filled: number, total: number): string {
  const lit = Math.max(0, Math.min(total, filled))
  return '▰'.repeat(lit) + '▱'.repeat(Math.max(0, total - lit))
}

export function clock(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const LOG_GLYPHS: Record<LogKind, string> = {
  raised: '📜', armed: '⚙', disarmed: '❄', wake: '⚡', review: '🔁', tired: '💧', threads: '🧵', checks: '🧪',
  conflict: '⚔', crack: '💥', victory: '🏆', scrapped: '🪦', warn: '!',
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
