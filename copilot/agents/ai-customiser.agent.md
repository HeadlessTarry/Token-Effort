---
name: "AI Customiser"
description: "Expert agent for creating, reviewing, and editing GitHub Copilot customisation files — agents, skills, prompt files, instruction files, and hooks. Use this agent when you want to add, change, or audit Copilot customisations in any project."
argument-hint: "Describe the customisation to create, or paste the file path to review"
model: "Claude Sonnet 4.6 (copilot)"
tools: ["read", "search", "web/fetch", "agent"]
agents: ["AI Customiser [Apply]"]
user-invocable: true
---
Read and follow the agent instructions at: ~/.ai/agents/ai-customiser.md
