import type { Register } from 'claude-code'

import { register as registerUnderlings } from '../mods/underlings/register'

/** Claude Code loads one hooks module per plugin, so this one registers every mod the overhaul ships. */
export const register: Register = (on, options) => {
  registerUnderlings(on, options)
}
