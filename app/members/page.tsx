import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MembersShell } from '@/components/members/members-shell'

export const metadata = { title: 'Members — Member Finance' }

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return <MembersShell userName={session.user.name} />
}
