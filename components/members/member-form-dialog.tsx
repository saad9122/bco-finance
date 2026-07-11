'use client'

import { useState, useEffect } from 'react'
import { createMember, updateMember } from '@/app/actions/members'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Loader2 } from 'lucide-react'
import type { Member } from '@/lib/db/schema'
import { toWholeAmount } from '@/lib/utils'

interface Props {
  open: boolean
  member: Member | null
  onClose: () => void
  onSaved: () => void
}

export function MemberFormDialog({ open, member, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [joinedAt, setJoinedAt] = useState('')
  const [openingAmountInHand, setOpeningAmountInHand] = useState('0')
  const [openingBalanceOfCredit, setOpeningBalanceOfCredit] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (member) {
      setName(member.name)
      setCode(member.code)
      setJoinedAt(member.joinedAt)
      setOpeningAmountInHand(toWholeAmount(member.openingAmountInHand))
      setOpeningBalanceOfCredit(toWholeAmount(member.openingBalanceOfCredit))
    } else {
      setName('')
      setCode('')
      setJoinedAt(new Date().toISOString().split('T')[0])
      setOpeningAmountInHand('0')
      setOpeningBalanceOfCredit('0')
    }
  }, [member, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const openingAIH = Math.round(parseFloat(openingAmountInHand))
    const openingBOC = Math.round(parseFloat(openingBalanceOfCredit))
    if (isNaN(openingAIH) || openingAIH < 0) {
      toast.error('Opening amount in hand must be a non-negative number')
      return
    }
    if (isNaN(openingBOC) || openingBOC < 0) {
      toast.error('Opening balance of credit must be a non-negative number')
      return
    }

    setSaving(true)

    const payload = {
      name,
      code,
      joinedAt,
      openingAmountInHand: openingAIH,
      openingBalanceOfCredit: openingBOC,
    }

    const result = member
      ? await updateMember(member.id, payload)
      : await createMember(payload)

    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(member ? 'Member updated' : 'Member created')
    onSaved()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {member ? 'Edit Member' : 'Add Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
              required
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Member Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. M001"
              required
              className="h-11 font-mono"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="joinedAt">Join Date</Label>
            <Input
              id="joinedAt"
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="openingAmountInHand">Opening Amount In Hand</Label>
            <Input
              id="openingAmountInHand"
              type="number"
              step="1"
              min="0"
              value={openingAmountInHand}
              onChange={(e) => setOpeningAmountInHand(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="openingBalanceOfCredit">
              Opening Balance of Credit
            </Label>
            <Input
              id="openingBalanceOfCredit"
              type="number"
              step="1"
              min="0"
              value={openingBalanceOfCredit}
              onChange={(e) => setOpeningBalanceOfCredit(e.target.value)}
              className="h-11"
            />
            {member && (
              <p className="text-xs text-muted-foreground">
                Changing opening balances will recalculate all existing records
                for this member.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : member ? (
                'Update Member'
              ) : (
                'Add Member'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
