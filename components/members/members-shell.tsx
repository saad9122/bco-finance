'use client'

import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { getMembers, toggleMemberActive } from '@/app/actions/members'
import { MemberFormDialog } from '@/components/members/member-form-dialog'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Filter, Loader2, UserCheck, UserX, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Member } from '@/lib/db/schema'

interface Props {
  userName: string
}

export function MembersShell({ userName }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    const data = await getMembers(showInactive)
    setMembers(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [showInactive])

  async function handleToggle(member: Member) {
    const result = await toggleMemberActive(member.id, !member.isActive) as { success?: boolean; error?: string }
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(
      member.isActive
        ? `${member.name} deactivated`
        : `${member.name} activated`
    )
    load()
  }

  const active = members.filter((m) => m.isActive)
  const inactive = members.filter((m) => !m.isActive)

  return (
    <div className="flex flex-col min-h-svh bg-background">
      <AppHeader
        userName={userName}
        title="Members"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowInactive((v) => !v)}
              className="h-9 gap-1.5"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </span>
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditTarget(null); setShowForm(true) }}
              className="h-9 gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 px-4 pb-8 max-w-5xl mx-auto w-full pt-5">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Users className="w-12 h-12 opacity-30" />
            <div className="text-center">
              <p className="font-semibold text-foreground">No members yet</p>
              <p className="text-sm mt-1">Add your first member to get started.</p>
            </div>
            <Button onClick={() => { setEditTarget(null); setShowForm(true) }} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Active members */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Active ({active.length})
              </h2>
              <div className="flex flex-col gap-2">
                {active.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onEdit={() => { setEditTarget(member); setShowForm(true) }}
                    onToggle={() => handleToggle(member)}
                  />
                ))}
              </div>
            </section>

            {/* Inactive members */}
            {showInactive && inactive.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Inactive ({inactive.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {inactive.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onEdit={() => { setEditTarget(member); setShowForm(true) }}
                      onToggle={() => handleToggle(member)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <MemberFormDialog
          open
          member={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSaved={() => { setShowForm(false); setEditTarget(null); load() }}
        />
      )}
    </div>
  )
}

function MemberCard({
  member,
  onEdit,
  onToggle,
}: {
  member: Member
  onEdit: () => void
  onToggle: () => void
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3 ${
      !member.isActive ? 'opacity-60' : ''
    }`}>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-primary">
          {member.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{member.code}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-9 w-9" aria-label="Edit">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9"
          aria-label={member.isActive ? 'Deactivate' : 'Activate'}
        >
          {member.isActive ? (
            <UserX className="w-4 h-4 text-destructive" />
          ) : (
            <UserCheck className="w-4 h-4 text-green-600" />
          )}
        </Button>
      </div>
    </div>
  )
}
