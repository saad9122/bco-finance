/**
 * Seeds the admin user by calling Better Auth's own sign-up endpoint.
 * This guarantees the password hash is 100% compatible because Better Auth
 * hashes it itself at runtime.
 *
 * Run with:  pnpm tsx scripts/seed-via-api.ts
 * Requires the dev server to be running on $DEV_PORT or 3000.
 */
import { Pool } from 'pg'

const ADMIN_NAME = 'admin123'
const ADMIN_EMAIL = 'admin@memberfinance.local'
const ADMIN_PASSWORD = 'abc1234'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    // Delete any existing bad rows so we can re-create cleanly
    await pool.query(`DELETE FROM account WHERE "providerId" = 'credential' AND "userId" IN (SELECT id FROM "user" WHERE email = $1)`, [ADMIN_EMAIL])
    await pool.query(`DELETE FROM "user" WHERE email = $1`, [ADMIN_EMAIL])
    console.log('Cleared any existing admin rows.')
  } finally {
    await pool.end()
  }

  // Call the Better Auth sign-up endpoint so it handles hashing itself
  const port = process.env.DEV_PORT ?? process.env.PORT ?? '3000'
  const base = `http://localhost:${port}`
  console.log(`Calling ${base}/api/auth/sign-up/email ...`)

  const res = await fetch(`${base}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  const body = await res.text()
  console.log(`Status: ${res.status}`)
  console.log(`Body:   ${body}`)

  if (res.ok) {
    console.log('\nAdmin user seeded successfully via Better Auth.')
    console.log(`  Email: ${ADMIN_EMAIL}`)
    console.log(`  Pass:  ${ADMIN_PASSWORD}`)
  } else {
    console.error('\nFailed to seed admin user. Check the response above.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
