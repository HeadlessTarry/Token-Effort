#!/usr/bin/env node
// Usage: merge-settings.js <target-file> <source-file>
// Deep-merges the source JSON into the target JSON file: objects merge key by key,
// arrays are unioned by JSON equality, other target keys are kept, and a missing
// target is created. Exits non-zero with a message when either file is invalid JSON.
const fs = require('node:fs')

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

function merge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (isObj(v) && isObj(a[k])) a[k] = merge(a[k], v)
    else if (Array.isArray(v) && Array.isArray(a[k])) a[k] = [...a[k], ...v.filter((x) => !a[k].some((y) => JSON.stringify(y) === JSON.stringify(x)))]
    else a[k] = v
  }
  return a
}

function readJson(file, fallback) {
  if (fallback !== undefined && !fs.existsSync(file)) return fallback
  const text = fs.readFileSync(file, 'utf8')
  try {
    return JSON.parse(text || '{}')
  } catch (error) {
    throw new Error(`${file}: invalid JSON (${error.message})`)
  }
}

function main(args) {
  const [target, source] = args
  if (!target || !source) {
    process.stderr.write('usage: merge-settings.js <target-file> <source-file>\n')
    return 2
  }
  try {
    const merged = merge(readJson(target, {}), readJson(source))
    fs.writeFileSync(target, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  } catch (error) {
    process.stderr.write(`merge-settings: ${error.message}\n`)
    return 1
  }
  return 0
}

process.exitCode = main(process.argv.slice(2))
