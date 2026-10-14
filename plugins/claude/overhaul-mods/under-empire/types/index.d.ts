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

/** Where an offering's Auto-fix watch stands. */
export type Phase = 'offering' | 'armed' | 'waking' | 'halted' | 'disarmed' | 'closed'

export type HaltKind = 'noise' | 'rounds' | 'other'

export type Offering = {
  /** `owner/name#pr` */
  key: string
  repo: string
  pr: number
  url: string
  phase: Phase
  autoFix: boolean
  /**
   * True once the shepherding-pr-reviews skill's script has printed for this PR. Until then the
   * offering is kept but never shown: no card, status line, toast or notification.
   */
  isShepherded: boolean
  /** Noise rounds counted toward the noise limit. */
  noise: number
  noiseLimit: number
  /** Review rounds processed. */
  rounds: number
  roundLimit: number
  /** Unanswered threads at the latest `check`; undefined until one runs. */
  openThreads?: number
  /** Human-reviewer threads waiting on the person's decision. */
  waiting: number
  /** The reason the watch halted, while halted. */
  haltReason?: string
  /** Which limit halted it: the noise limit overheats the wheel, the round limit exhausts its rat. */
  haltKind?: HaltKind
  createdAt: number
  updatedAt: number
}

export type LogKind = 'raised' | 'armed' | 'disarmed' | 'wake' | 'round' | 'heat' | 'tired' | 'halt' | 'answered' | 'warn' | 'closed'

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
