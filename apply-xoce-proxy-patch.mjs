import { readFile, writeFile } from 'node:fs/promises'

const path = '/home/node/xen-orchestra/@xen-orchestra/proxy/app/mixins/appliance.mjs'
const source = await readFile(path, 'utf8')
const pattern = /  getSelfLicense\(\) \{\n    return Disposable\.use\(getUpdater\(\), async updater => \{\n      const licenses = await updater\.call\('getSelfLicenses'\)\n      const now = Date\.now\(\)\n      return licenses\.find\(\(\{ expires \}\) => expires === undefined \|\| expires > now\)\n    \}\)\n  \}/

if (!pattern.test(source)) {
  throw new Error('upstream getSelfLicense() block changed; refusing to build without reviewing the CE patch')
}

await writeFile(
  path,
  source.replace(
    pattern,
    `  // Community Edition source build: no XOA appliance updater is present.
  getSelfLicense() {
    return true
  }`
  )
)

