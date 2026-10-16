import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { applyCeCompatibility } from '../apply-xoce-proxy-patch.mjs'

async function fixture(t, source, caller = '') {
  const app = await mkdtemp(join(tmpdir(), 'xo-ce-test-'))
  t.after(() => rm(app, { recursive: true, force: true }))
  await mkdir(join(app, 'mixins'))
  await writeFile(join(app, 'mixins/appliance.mjs'), source)
  await writeFile(join(app, 'mixins/backups.mjs'), caller)
  return app
}

for (const method of [
  'getSelfLicense() { throw new Error("updater unavailable") }',
  'async getSelfLicense(options = {}) { const nested = { changed: true }; return nested }',
]) {
  test(`overrides upstream implementation: ${method}`, async t => {
    const source = `export const extra = 42; export default class Appliance {
      constructor(app) { this.app = app }
      ${method}
      otherMethod() { return this.app.value }
    }`
    const app = await fixture(t, source, 'app.appliance.getSelfLicense()')
    assert.equal(await applyCeCompatibility(app), 'overridden')
    assert.equal(await readFile(join(app, 'mixins/appliance.upstream.mjs'), 'utf8'), source)
    // A fresh URL avoids the build-time inspection import's module cache.
    const module = await import(pathToFileURL(join(app, 'mixins/appliance.mjs')).href + '?wrapped')
    const appliance = new module.default({ value: 123 })
    assert.equal(await appliance.getSelfLicense(), true)
    assert.equal(appliance.otherMethod(), 123)
    assert.equal(module.extra, 42)
  })
}

test('leaves newer upstream without the method or callers untouched', async t => {
  const source = 'export default class Appliance {}'
  const app = await fixture(t, source)
  assert.equal(await applyCeCompatibility(app), 'not-needed')
  assert.equal(await readFile(join(app, 'mixins/appliance.mjs'), 'utf8'), source)
})

test('rejects a missing method with remaining callers', async t => {
  const app = await fixture(t, 'export default class Appliance {}', 'app.appliance.getSelfLicense()')
  await assert.rejects(applyCeCompatibility(app), /references remain/)
})

test('rejects a changed export contract', async t => {
  const app = await fixture(t, 'export default {}')
  await assert.rejects(applyCeCompatibility(app), /no longer exports a class/)
})

test('rejects an accessor instead of a method', async t => {
  const app = await fixture(t, 'export default class Appliance { get getSelfLicense() { return true } }')
  await assert.rejects(applyCeCompatibility(app), /no longer a method/)
})
