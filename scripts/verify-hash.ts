import { Pool } from 'pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  // Get the full password hash
  const a = await pool.query('SELECT password FROM account WHERE "providerId" = \'credential\'')
  const hash = a.rows[0]?.password ?? 'NOT FOUND'
  console.log('Full hash length:', hash.length)
  console.log('Hash:', hash)
  const [salt, key] = hash.split(':')
  console.log('Salt length (chars):', salt?.length, '— expected 32')
  console.log('Key length  (chars):', key?.length,  '— expected 128')
  await pool.end()
}

main().catch(console.error)
