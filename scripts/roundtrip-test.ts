import { scryptAsync } from '@noble/hashes/scrypt'

const STORED_HASH = '3ea7328f23a6bc97417b03184c4e66b2:63341e9a3026dbec3361e14678dd915f313dd9eb6a3165b9bc880eaa4cbc8b6878104440ad098c814fbe730ead09f74cbec4532d31cd966aaf028ce64956e1c3'
const PASSWORD = 'abc1234'

function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function main() {
  const [salt, storedKey] = STORED_HASH.split(':')

  const derived = await scryptAsync(PASSWORD.normalize('NFKC'), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  })

  const derivedHex = encodeHex(derived)
  console.log('Stored key :', storedKey)
  console.log('Derived key:', derivedHex)
  console.log('Match:', derivedHex === storedKey)
}

main().catch(console.error)
