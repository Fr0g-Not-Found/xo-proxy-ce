import { randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const configuredAddress = process.env.XO_PROXY_ADDRESS
if (configuredAddress === undefined || configuredAddress === '') {
  process.exit(0)
}

if (configuredAddress.includes('://')) {
  throw new Error('XO_PROXY_ADDRESS must be host[:port], without http:// or https://')
}
const parsedAddress = new URL(`https://${configuredAddress}`)
if (parsedAddress.pathname !== '/' || parsedAddress.search !== '' || parsedAddress.hash !== '') {
  throw new Error('XO_PROXY_ADDRESS must contain only host[:port]')
}
const address = parsedAddress.host

const tokenFile = process.env.XO_PROXY_TOKEN_FILE ?? '/etc/xo-proxy/authentication-token'
const idFile = process.env.XO_PROXY_ID_FILE ?? '/etc/xo-proxy/id'
const output = process.env.XO_PROXY_REGISTRATION_FILE ?? '/etc/xo-proxy/registration.json'
const name = process.env.XO_PROXY_NAME ?? 'XO CE Proxy'

await mkdir(dirname(output), { recursive: true })

let id
try {
  id = (await readFile(idFile, 'utf8')).trim()
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  id = randomUUID()
  await writeFile(idFile, `${id}\n`, { mode: 0o600 })
}

const authenticationToken = (await readFile(tokenFile, 'utf8')).trim()
const registration = {
  proxies: [{ address, authenticationToken, id, name }],
}

await writeFile(output, `${JSON.stringify(registration)}\n`, { mode: 0o600 })
await chmod(output, 0o600)
