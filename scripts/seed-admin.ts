/**
 * Seed script — creates the default admin user.
 * Idempotent: skips if the email already exists.
 *
 * Uses Better Auth's own hashPassword so the stored hash is always compatible.
 *
 * Run with:  npm run seed:admin
 */
import './load-env'
import { Pool } from 'pg'
import { randomUUID } from 'crypto'
import { hashPassword } from 'better-auth/crypto'

const ADMIN_NAME = 'admin123'
const ADMIN_EMAIL = 'admin@memberfinance.local'
const ADMIN_PASSWORD = 'abc1234'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is not set. Add it to .env.development.local (or .env.local).'
    )
    process.exit(1)
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    // Check if admin already exists
    const existing = await pool.query(
      `SELECT id FROM "user" WHERE email = $1`,
      [ADMIN_EMAIL]
    )

    if (existing.rows.length > 0) {
      console.log(`Admin user already exists (id: ${existing.rows[0].id}). Skipping.`)
      return
    }

    const userId = randomUUID()
    const accountId = randomUUID()
    const hashedPassword = await hashPassword(ADMIN_PASSWORD)
    const now = new Date()

    // Insert user row
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, $4, $5)`,
      [userId, ADMIN_NAME, ADMIN_EMAIL, now, now]
    )

    // Insert account row (credential provider — Better Auth stores the hashed password here)
    await pool.query(
      `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, $5, $6)`,
      [accountId, userId, userId, hashedPassword, now, now]
    )

    console.log('Admin user created successfully.')
    console.log(`  Name:  ${ADMIN_NAME}`)
    console.log(`  Email: ${ADMIN_EMAIL}`)
    console.log(`  Pass:  ${ADMIN_PASSWORD}`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
