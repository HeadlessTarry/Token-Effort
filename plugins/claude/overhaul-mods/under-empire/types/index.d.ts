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

declare module 'claude-code' {
  interface PluginState {
    'under-empire': {
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
