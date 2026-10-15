// The under-empire $.state contract, one self-contained file as the engine requires. Each mod
// declares its own values under the plugin's name, every key prefixed with the mod's name.

// ---------------------------------------------------------------- underlings

export type Kind = 'research' | 'experiment' | 'build' | 'test' | 'other'

export type Status = 'running' | 'done' | 'failed' | 'stopped'

export type Underling = {
  /** The subagent's agentId, or the background task id. */
  id: string
  type: 'subagent' | 'bash'
  title: string
  kind: Kind
  status: Status
  startedAt: number
  endedAt?: number
  /** The tool call that started it (Agent or Bash). */
  toolUseId?: string
  agentType?: string
  model?: string
  tokens?: number
  command?: string
  outputPath?: string
  exitCode?: number
}

export type TxEntry =
  | { kind: 'text' | 'thinking'; text: string }
  | { kind: 'tool'; id: string; name: string; arg: string; result?: string; isError?: boolean }

// ---------------------------------------------------------------- doomwheel

/** Where an offering's review process stands. `victory` (merged) and `scrapped` (closed) are retired. */
export type Phase = 'offering' | 'armed' | 'waking' | 'cracked' | 'cold' | 'victory' | 'scrapped'

export type Offering = {
  /** `owner/name#pr` */
  key: string
  repo: string
  pr: number
  url: string
  phase: Phase
  autoFix: boolean
  /** Submitted reviews, from any reviewer, at the latest poll. */
  laps: number
  /** Review threads at the latest poll. */
  unresolvedThreads: number
  totalThreads: number
  /** Failing checks on the head commit at the latest poll. */
  failingChecks: number
  /** True while GitHub reports a merge conflict. */
  conflict: boolean
  /** When GitHub last answered a poll; undefined until it has. */
  polledAt?: number
  /** True while `gh` is missing or not signed in, so the wheel runs on session signals alone. */
  ghUnavailable?: boolean
  createdAt: number
  updatedAt: number
}

export type LogKind =
  | 'raised' | 'armed' | 'disarmed' | 'wake' | 'review' | 'tired' | 'threads' | 'checks' | 'conflict'
  | 'crack' | 'victory' | 'scrapped' | 'warn'

export type LogEntry = { at: number; key: string; kind: LogKind; text: string }

declare module 'claude-code' {
  interface PluginState {
    'under-empire': {
      'doomwheel.offerings': Offering[]
      'doomwheel.log': LogEntry[]
      'underlings.list': Underling[]
      'underlings.selected': string | null
      'underlings.now': number
      /** Roster groups, by label, showing every row rather than the first few. */
      'underlings.expanded': string[]
      'underlings.transcript': StateFamily<TxEntry[]>
      'underlings.output': StateFamily<string>
    }
  }
}
