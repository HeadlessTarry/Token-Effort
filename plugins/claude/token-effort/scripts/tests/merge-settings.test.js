const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

const SCRIPT = path.join(__dirname, '..', 'merge-settings.js')

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'merge-settings-'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value), 'utf8')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function merge(target, source) {
  return spawnSync(process.execPath, [SCRIPT, target, source], { encoding: 'utf8' })
}

test('deep-merges nested objects and keeps unrelated keys', () => {
  const dir = tempDir()
  const target = path.join(dir, 'settings.json')
  const source = path.join(dir, 'source.json')
  writeJson(target, { theme: 'dark', env: { MINE: '1' }, worktree: { baseRef: 'head' } })
  writeJson(source, { env: { PYTHONUTF8: '1' }, worktree: { baseRef: 'fresh' } })

  const result = merge(target, source)

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(readJson(target), {
    theme: 'dark',
    env: { MINE: '1', PYTHONUTF8: '1' },
    worktree: { baseRef: 'fresh' },
  })
})

test('unions arrays by JSON equality, keeping existing order', () => {
  const dir = tempDir()
  const target = path.join(dir, 'settings.json')
  const source = path.join(dir, 'source.json')
  writeJson(target, { permissions: { allow: ['Bash(ls *)', 'Mine'] }, list: [{ a: 1 }] })
  writeJson(source, { permissions: { allow: ['Bash(ls *)', 'Bash(cat *)'] }, list: [{ a: 1 }, { b: 2 }] })

  const result = merge(target, source)

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(readJson(target), {
    permissions: { allow: ['Bash(ls *)', 'Mine', 'Bash(cat *)'] },
    list: [{ a: 1 }, { b: 2 }],
  })
})

test('creates the target when it is missing', () => {
  const dir = tempDir()
  const target = path.join(dir, 'settings.json')
  const source = path.join(dir, 'source.json')
  writeJson(source, { model: 'opus' })

  const result = merge(target, source)

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(readJson(target), { model: 'opus' })
})

test('treats an empty target as an empty object', () => {
  const dir = tempDir()
  const target = path.join(dir, 'settings.json')
  const source = path.join(dir, 'source.json')
  fs.writeFileSync(target, '', 'utf8')
  writeJson(source, { model: 'opus' })

  assert.equal(merge(target, source).status, 0)
  assert.deepEqual(readJson(target), { model: 'opus' })
})

test('a second run changes nothing', () => {
  const dir = tempDir()
  const target = path.join(dir, 'settings.json')
  const source = path.join(dir, 'source.json')
  writeJson(target, { permissions: { allow: ['Mine'] } })
  writeJson(source, { permissions: { allow: ['Bash(ls *)'] }, env: { PYTHONUTF8: '1' } })

  merge(target, source)
  const first = fs.readFileSync(target, 'utf8')
  merge(target, source)

  assert.equal(fs.readFileSync(target, 'utf8'), first)
})

test('fails with a message and leaves the target alone on invalid JSON', () => {
  const dir = tempDir()
  const target = path.join(dir, 'settings.json')
  const source = path.join(dir, 'source.json')
  fs.writeFileSync(target, '{ not json', 'utf8')
  writeJson(source, { model: 'opus' })

  const result = merge(target, source)

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /settings\.json/)
  assert.equal(fs.readFileSync(target, 'utf8'), '{ not json')
})

test('fails with usage when arguments are missing', () => {
  const result = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /usage/i)
})
