import { readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const defaultAppPath = '/home/node/xen-orchestra/@xen-orchestra/proxy/app'

async function hasLicenseCallers(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (await hasLicenseCallers(path)) return true
    } else if (/\.(?:mjs|cjs|js)$/.test(entry.name)) {
      // Conservative compatibility guard, not a match against the method body.
      if (/\bgetSelfLicense\b/.test(await readFile(path, 'utf8'))) return true
    }
  }
  return false
}

export async function applyCeCompatibility(appPath = defaultAppPath) {
  const path = join(appPath, 'mixins/appliance.mjs')
  const { default: Appliance } = await import(pathToFileURL(path).href)
  if (typeof Appliance !== 'function' || Appliance.prototype === undefined) {
    throw new Error('upstream appliance no longer exports a class; review CE compatibility')
  }

  const descriptor = Object.getOwnPropertyDescriptor(Appliance.prototype, 'getSelfLicense')
  if (descriptor === undefined) {
    if (await hasLicenseCallers(appPath)) {
      throw new Error('getSelfLicense is missing but references remain; review CE compatibility')
    }
    console.log('CE compatibility: upstream no longer uses getSelfLicense; no override needed')
    return 'not-needed'
  }
  if (typeof descriptor.value !== 'function') {
    throw new Error('getSelfLicense is no longer a method; review CE compatibility')
  }

  // Keep the upstream module intact, including its other exports and behavior.
  // The wrapper overrides only the CE hook, independent of its implementation.
  await rename(path, join(appPath, 'mixins/appliance.upstream.mjs'))
  await writeFile(path, `import Appliance from './appliance.upstream.mjs'
export * from './appliance.upstream.mjs'

// Community Edition source build: no XOA appliance updater is present.
Object.defineProperty(Appliance.prototype, 'getSelfLicense', {
  configurable: true,
  writable: true,
  value() { return true },
})

export default Appliance
`)
  console.log('CE compatibility: installed getSelfLicense override')
  return 'overridden'
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await applyCeCompatibility()
}
