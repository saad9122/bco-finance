'use server'

import { auth } from '@/lib/auth'
import { db, pool } from '@/lib/db'
import { monthlyRecords, members } from '@/lib/db/schema'
import {
  getPreviousAmountInHand,
  getPreviousBalanceOfCredit,
  getPreviousMonth,
  parseAmount,
  recalculateFromMonth,
  type ChronologicalRecord,
} from '@/lib/calculations'
import { and, eq, asc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getPriorMonthRecord(
  userId: string,
  memberId: number,
  year: number,
  month: number
) {
  const prev = getPreviousMonth(year, month)
  const [record] = await db
    .select()
    .from(monthlyRecords)
    .where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(monthlyRecords.memberId, memberId),
        eq(monthlyRecords.year, prev.year),
        eq(monthlyRecords.month, prev.month)
      )
    )
  return record ?? null
}

export async function getMonthlyRecords(year: number, month: number) {
  const userId = await getUserId()

  const activeMembers = await db
    .select()
    .from(members)
    .where(eq(members.isActive, true))
    .orderBy(asc(members.code))

  const records = await db
    .select()
    .from(monthlyRecords)
    .where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(monthlyRecords.year, year),
        eq(monthlyRecords.month, month)
      )
    )

  const recordMap = new Map(records.map((r) => [r.memberId, r]))

  const prev = getPreviousMonth(year, month)
  const priorRecords = await db
    .select()
    .from(monthlyRecords)
    .where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(monthlyRecords.year, prev.year),
        eq(monthlyRecords.month, prev.month)
      )
    )
  const priorMap = new Map(priorRecords.map((r) => [r.memberId, r]))

  return activeMembers.map((member) => {
    const record = recordMap.get(member.id) ?? null
    const priorRecord = priorMap.get(member.id) ?? null
    const previousBalanceOfCredit = getPreviousBalanceOfCredit(
      priorRecord,
      member.openingBalanceOfCredit
    )
    const previousAmountInHand = getPreviousAmountInHand(
      priorRecord,
      member.openingAmountInHand
    )
    return { member, record, previousBalanceOfCredit, previousAmountInHand }
  })
}

export async function getRecordForMember(
  memberId: number,
  year: number,
  month: number
) {
  const userId = await getUserId()
  const [record] = await db
    .select()
    .from(monthlyRecords)
    .where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(monthlyRecords.memberId, memberId),
        eq(monthlyRecords.year, year),
        eq(monthlyRecords.month, month)
      )
    )
  return record ?? null
}

export async function getRecordContextForMember(
  memberId: number,
  year: number,
  month: number
) {
  const userId = await getUserId()
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))

  if (!member) return null

  const record = await getRecordForMember(memberId, year, month)
  const priorRecord = await getPriorMonthRecord(userId, memberId, year, month)

  return {
    member,
    record,
    priorRecord,
    previousBalanceOfCredit: getPreviousBalanceOfCredit(
      priorRecord,
      member.openingBalanceOfCredit
    ),
  }
}

const RecordSchema = z.object({
  memberId: z.number().int().positive(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  monthlyFee: z.number().min(0, 'Must be >= 0'),
  loanReturned: z.number().min(0, 'Must be >= 0'),
  loanIssued: z.number().min(0, 'Must be >= 0'),
  remarks: z.string().optional(),
})

async function recalculateMemberFromMonth(
  client: import('pg').PoolClient,
  userId: string,
  memberId: number,
  fromYear: number,
  fromMonth: number
) {
  const [memberRow] = (
    await client.query(`SELECT * FROM members WHERE id = $1`, [memberId])
  ).rows
  if (!memberRow) return

  const openingAIH = parseAmount(memberRow.openingAmountInHand)
  const openingBOC = parseAmount(memberRow.openingBalanceOfCredit)

  const allRecords = await client.query(
    `SELECT * FROM monthly_records
     WHERE "userId" = $1 AND "memberId" = $2
     ORDER BY year ASC, month ASC`,
    [userId, memberId]
  )

  const chronological: ChronologicalRecord[] = allRecords.rows.map(
    (row: Record<string, string | number>) => ({
      id: row.id as number,
      year: row.year as number,
      month: row.month as number,
      monthlyFee: parseAmount(row.monthlyFee as string),
      loanReturned: parseAmount(row.loanReturned as string),
      loanIssued: parseAmount(row.loanIssued as string),
      amountInHand: parseAmount(row.amountInHand as string),
      balanceOfCredit: parseAmount(row.balanceOfCredit as string),
    })
  )

  const updated = recalculateFromMonth(
    chronological,
    openingAIH,
    openingBOC,
    fromYear,
    fromMonth
  )

  const startIndex = updated.findIndex(
    (r) => r.year === fromYear && r.month === fromMonth
  )
  if (startIndex === -1) return

  for (let i = startIndex; i < updated.length; i++) {
    const r = updated[i]
    await client.query(
      `UPDATE monthly_records
       SET "amountInHand" = $1, "balanceOfCredit" = $2, "updatedAt" = now()
       WHERE id = $3`,
      [r.amountInHand.toFixed(2), r.balanceOfCredit.toFixed(2), r.id]
    )
  }
}

export async function recalculateMemberRecords(memberId: number) {
  const userId = await getUserId()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const earliest = await client.query(
      `SELECT year, month FROM monthly_records
       WHERE "userId" = $1 AND "memberId" = $2
       ORDER BY year ASC, month ASC
       LIMIT 1`,
      [userId, memberId]
    )

    if (earliest.rows.length === 0) {
      await client.query('COMMIT')
      return { success: true }
    }

    const { year, month } = earliest.rows[0]
    await recalculateMemberFromMonth(
      client,
      userId,
      memberId,
      year,
      month
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[records] recalculate error', err)
    return { error: 'Failed to recalculate records.' }
  } finally {
    client.release()
  }

  revalidatePath('/')
  return { success: true }
}

export async function upsertRecord(data: {
  memberId: number
  year: number
  month: number
  monthlyFee: number
  loanReturned: number
  loanIssued: number
  remarks?: string
}) {
  const userId = await getUserId()
  const parsed = RecordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { memberId, year, month, monthlyFee, loanReturned, loanIssued, remarks } =
    parsed.data

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO monthly_records
         ("userId", "memberId", year, month, "monthlyFee", "loanReturned", "loanIssued", remarks, "amountInHand", "balanceOfCredit", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '0', '0', now(), now())
       ON CONFLICT ("userId", "memberId", year, month)
       DO UPDATE SET
         "monthlyFee"   = EXCLUDED."monthlyFee",
         "loanReturned" = EXCLUDED."loanReturned",
         "loanIssued"   = EXCLUDED."loanIssued",
         remarks        = EXCLUDED.remarks,
         "updatedAt"    = now()`,
      [
        userId,
        memberId,
        year,
        month,
        monthlyFee.toFixed(2),
        loanReturned.toFixed(2),
        loanIssued.toFixed(2),
        remarks ?? null,
      ]
    )

    await recalculateMemberFromMonth(client, userId, memberId, year, month)

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[records] upsert error', err)
    return { error: 'Failed to save record. Please try again.' }
  } finally {
    client.release()
  }

  revalidatePath('/')
  return { success: true }
}

const BulkMonthlySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  records: z
    .array(
      z.object({
        memberId: z.number().int().positive(),
        monthlyFee: z.number().min(0, 'Must be >= 0'),
        loanReturned: z.number().min(0, 'Must be >= 0'),
        loanIssued: z.number().min(0, 'Must be >= 0'),
        remarks: z.string().optional(),
      })
    )
    .min(1),
})

export async function bulkUpsertMonthlyRecords(
  year: number,
  month: number,
  records: Array<{
    memberId: number
    monthlyFee: number
    loanReturned: number
    loanIssued: number
    remarks?: string
  }>
) {
  const userId = await getUserId()
  const parsed = BulkMonthlySchema.safeParse({ year, month, records })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const memberIds = new Set<number>()

    for (const record of parsed.data.records) {
      await client.query(
        `INSERT INTO monthly_records
           ("userId", "memberId", year, month, "monthlyFee", "loanReturned", "loanIssued", remarks, "amountInHand", "balanceOfCredit", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '0', '0', now(), now())
         ON CONFLICT ("userId", "memberId", year, month)
         DO UPDATE SET
           "monthlyFee"   = EXCLUDED."monthlyFee",
           "loanReturned" = EXCLUDED."loanReturned",
           "loanIssued"   = EXCLUDED."loanIssued",
           remarks        = COALESCE(EXCLUDED.remarks, monthly_records.remarks),
           "updatedAt"    = now()`,
        [
          userId,
          record.memberId,
          year,
          month,
          record.monthlyFee.toFixed(2),
          record.loanReturned.toFixed(2),
          record.loanIssued.toFixed(2),
          record.remarks ?? null,
        ]
      )
      memberIds.add(record.memberId)
    }

    for (const memberId of memberIds) {
      await recalculateMemberFromMonth(client, userId, memberId, year, month)
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[records] bulk upsert error', err)
    return { error: 'Failed to save records. Please try again.' }
  } finally {
    client.release()
  }

  revalidatePath('/')
  return { success: true, updated: parsed.data.records.length }
}

export async function getMemberRecordHistory(memberId: number) {
  const userId = await getUserId()
  const records = await db
    .select()
    .from(monthlyRecords)
    .where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(monthlyRecords.memberId, memberId)
      )
    )
    .orderBy(asc(monthlyRecords.year), asc(monthlyRecords.month))
  return records
}

export async function getAllRecordsForExport(
  filter: 'month' | 'year' | 'all',
  year?: number,
  month?: number
) {
  const userId = await getUserId()

  let query = db
    .select({
      memberName: members.name,
      memberCode: members.code,
      memberId: monthlyRecords.memberId,
      year: monthlyRecords.year,
      month: monthlyRecords.month,
      amountInHand: monthlyRecords.amountInHand,
      monthlyFee: monthlyRecords.monthlyFee,
      loanReturned: monthlyRecords.loanReturned,
      loanIssued: monthlyRecords.loanIssued,
      balanceOfCredit: monthlyRecords.balanceOfCredit,
      remarks: monthlyRecords.remarks,
      openingBalanceOfCredit: members.openingBalanceOfCredit,
    })
    .from(monthlyRecords)
    .innerJoin(members, eq(monthlyRecords.memberId, members.id))
    .where(
      and(eq(monthlyRecords.userId, userId), eq(members.isActive, true))
    )
    .$dynamic()

  if (filter === 'month' && year && month) {
    query = query.where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(members.isActive, true),
        eq(monthlyRecords.year, year),
        eq(monthlyRecords.month, month)
      )
    )
  } else if (filter === 'year' && year) {
    query = query.where(
      and(
        eq(monthlyRecords.userId, userId),
        eq(members.isActive, true),
        eq(monthlyRecords.year, year)
      )
    )
  }

  const rows = await query.orderBy(
    asc(members.code),
    asc(monthlyRecords.year),
    asc(monthlyRecords.month)
  )

  const priorRecords = await db
    .select({
      memberId: monthlyRecords.memberId,
      year: monthlyRecords.year,
      month: monthlyRecords.month,
      balanceOfCredit: monthlyRecords.balanceOfCredit,
    })
    .from(monthlyRecords)
    .where(eq(monthlyRecords.userId, userId))

  const priorMap = new Map(
    priorRecords.map((r) => [`${r.memberId}-${r.year}-${r.month}`, r])
  )

  return rows.map((row) => {
    const prev = getPreviousMonth(row.year, row.month)
    const prior = priorMap.get(`${row.memberId}-${prev.year}-${prev.month}`)
    const previousBalanceOfCredit = getPreviousBalanceOfCredit(
      prior ?? null,
      row.openingBalanceOfCredit
    )
    return {
      memberName: row.memberName,
      memberCode: row.memberCode,
      year: row.year,
      month: row.month,
      amountInHand: row.amountInHand,
      monthlyFee: row.monthlyFee,
      previousBalanceOfCredit: String(Math.round(previousBalanceOfCredit)),
      loanReturned: row.loanReturned,
      loanIssued: row.loanIssued,
      balanceOfCredit: row.balanceOfCredit,
      remarks: row.remarks,
    }
  })
}

export async function importMonthlyRecordsCsv(
  year: number,
  month: number,
  rows: Array<{
    memberId: number
    monthlyFee: number
    loanReturned: number
    loanIssued: number
  }>
) {
  await getUserId()

  const parsed = BulkMonthlySchema.safeParse({
    year,
    month,
    records: rows.map((row) => ({
      memberId: row.memberId,
      monthlyFee: Math.round(row.monthlyFee),
      loanReturned: Math.round(row.loanReturned),
      loanIssued: Math.round(row.loanIssued),
    })),
  })

  if (!parsed.success) {
    return { imported: 0, errors: [parsed.error.issues[0].message] }
  }

  const existingMembers = await db.select({ id: members.id }).from(members)
  const memberIds = new Set(existingMembers.map((m) => m.id))

  const errors: string[] = []
  const validRecords: Array<{
    memberId: number
    monthlyFee: number
    loanReturned: number
    loanIssued: number
  }> = []

  for (const row of parsed.data.records) {
    if (!memberIds.has(row.memberId)) {
      errors.push(`Member not found: ID ${row.memberId}`)
      continue
    }
    validRecords.push(row)
  }

  if (validRecords.length === 0) {
    return { imported: 0, errors: errors.length > 0 ? errors : ['No valid rows to import'] }
  }

  const result = await bulkUpsertMonthlyRecords(year, month, validRecords)
  if (result.error) {
    return { imported: 0, errors: [result.error, ...errors] }
  }

  revalidatePath('/')
  return { imported: result.updated ?? validRecords.length, errors }
}
