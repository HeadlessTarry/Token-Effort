import type { Plugin } from "@opencode-ai/plugin"

const SKILL_AGENT_PATTERNS = [
  // Repo-level skill: skills/<name>/SKILL.md
  /^skills\/([^/]+)\/SKILL\.md$/,
  // Repo-level agent: agents/<name>.md
  /^agents\/([^/]+)\.md$/,
  // Project-level skill: .opencode/skills/<name>/SKILL.md
  /^(.*\/)?\.opencode\/skills\/([^/]+)\/SKILL\.md$/,
  // Project-level agent: .opencode/agents/<name>.md
  /^(.*\/)?\.opencode\/agents\/([^/]+)\.md$/,
] as const

function extractKindAndName(filePath: string): { kind: string; name: string } | null {
  const normalised = filePath.replace(/\\/g, "/")

  for (const pattern of SKILL_AGENT_PATTERNS) {
    const match = normalised.match(pattern)
    if (match) {
      const isSkill = normalised.includes("/skills/")
      return {
        kind: isSkill ? "skill" : "agent",
        name: match[2],
      }
    }
  }

  return null
}

export const SuggestTrainingPlugin: Plugin = async () => {
  return {
    "tool.execute.after": async (input, output) => {
      if (
        input.tool !== "edit" &&
        input.tool !== "write" &&
        input.tool !== "apply_patch"
      ) {
        return
      }

      const filePath = input.args?.filePath ?? ""
      if (!filePath) return

      const result = extractKindAndName(filePath)
      if (!result) return

      const { kind, name } = result
      const article = kind === "agent" ? "An" : "A"

      output.output += `\n\nSYSTEM: ${article} ${kind} definition was just edited: ${name}. You MUST prompt the user to ask if they wish to run /run-training before proceeding with any other task.`
    },
  }
}
