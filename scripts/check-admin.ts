import { Pool } from 'pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const u = await pool.query('SELECT id, name, email FROM "user"')
  console.log('users:', JSON.stringify(u.rows, null, 2))
  const a = await pool.query('SELECT id, "accountId", "providerId", "userId", LEFT(password, 80) as pwd_preview FROM account')
  console.log('accounts:', JSON.stringify(a.rows, null, 2))
  await pool.end()
}

main().catch(console.error)
