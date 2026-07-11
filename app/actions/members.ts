'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { recalculateMemberRecords } from '@/app/actions/records'
import { eq, asc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

const MemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  joinedAt: z.string().min(1, 'Join date is required'),
  openingAmountInHand: z.number().min(0, 'Must be >= 0').default(0),
  openingBalanceOfCredit: z.number().min(0, 'Must be >= 0').default(0),
})

export async function getMembers(includeInactive = false) {
  await getUserId()

  if (includeInactive) {
    return db.select().from(members).orderBy(asc(members.code))
  }

  return db
    .select()
    .from(members)
    .where(eq(members.isActive, true))
    .orderBy(asc(members.code))
}

export async function getMemberById(id: number) {
  await getUserId()
  const [member] = await db.select().from(members).where(eq(members.id, id))
  return member ?? null
}

export async function createMember(formData: {
  name: string
  code: string
  joinedAt: string
  openingAmountInHand?: number
  openingBalanceOfCredit?: number
}) {
  await getUserId()
  const parsed = MemberSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await db.insert(members).values({
    name: parsed.data.name,
    code: parsed.data.code,
    joinedAt: parsed.data.joinedAt,
    openingAmountInHand: parsed.data.openingAmountInHand.toFixed(2),
    openingBalanceOfCredit: parsed.data.openingBalanceOfCredit.toFixed(2),
    isActive: true,
  })

  revalidatePath('/')
  revalidatePath('/members')
  return { success: true }
}

export async function updateMember(
  id: number,
  formData: {
    name: string
    code: string
    joinedAt: string
    openingAmountInHand?: number
    openingBalanceOfCredit?: number
  }
) {
  await getUserId()
  const parsed = MemberSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await db
    .update(members)
    .set({
      name: parsed.data.name,
      code: parsed.data.code,
      joinedAt: parsed.data.joinedAt,
      openingAmountInHand: parsed.data.openingAmountInHand.toFixed(2),
      openingBalanceOfCredit: parsed.data.openingBalanceOfCredit.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(members.id, id))

  const recalcResult = await recalculateMemberRecords(id)
  if (recalcResult.error) {
    return { error: recalcResult.error }
  }

  revalidatePath('/')
  revalidatePath('/members')
  return { success: true }
}

export async function toggleMemberActive(id: number, isActive: boolean) {
  await getUserId()
  await db
    .update(members)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(members.id, id))

  revalidatePath('/members')
  revalidatePath('/')
  return { success: true }
}
