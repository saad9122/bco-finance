'use client'

import { useEffect, useState } from 'react'
import {
  upsertRecord,
  getRecordContextForMember,
} from '@/app/actions/records'
import { computeRecordPreview } from '@/lib/calculations'
import { formatAmount, toWholeAmount } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Loader2, Calculator } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props {
  open: boolean
  memberId: number
  memberName: string
  year: number
  month: number
  onClose: () => void
  onSaved: () => void
}

export function RecordEditorDialog({
  open,
  memberId,
  memberName,
  year,
  month,
  onClose,
  onSaved,
}: Props) {
  const [monthlyFee, setMonthlyFee] = useState('')
  const [loanReturned, setLoanReturned] = useState('')
  const [loanIssued, setLoanIssued] = useState('')
  const [remarks, setRemarks] = useState('')
  const [openingAmountInHand, setOpeningAmountInHand] = useState('0')
  const [openingBalanceOfCredit, setOpeningBalanceOfCredit] = useState('0')
  const [priorRecord, setPriorRecord] = useState<{
    amountInHand: string
    balanceOfCredit: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getRecordContextForMember(memberId, year, month).then((ctx) => {
      if (!ctx) {
        setLoading(false)
        return
      }
      setMonthlyFee(toWholeAmount(ctx.record?.monthlyFee))
      setLoanReturned(toWholeAmount(ctx.record?.loanReturned))
      setLoanIssued(toWholeAmount(ctx.record?.loanIssued))
      setRemarks(ctx.record?.remarks ?? '')
      setOpeningAmountInHand(toWholeAmount(ctx.member.openingAmountInHand))
      setOpeningBalanceOfCredit(toWholeAmount(ctx.member.openingBalanceOfCredit))
      setPriorRecord(
        ctx.priorRecord
          ? {
              amountInHand: ctx.priorRecord.amountInHand,
              balanceOfCredit: ctx.priorRecord.balanceOfCredit,
            }
          : null
      )
      setLoading(false)
    })
  }, [open, memberId, year, month])

  const preview = computeRecordPreview(
    {
      monthlyFee: parseFloat(monthlyFee) || 0,
      loanReturned: parseFloat(loanReturned) || 0,
      loanIssued: parseFloat(loanIssued) || 0,
    },
    priorRecord,
    openingAmountInHand,
    openingBalanceOfCredit
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fee = Math.round(parseFloat(monthlyFee))
    const returned = Math.round(parseFloat(loanReturned))
    const issued = Math.round(parseFloat(loanIssued))
    if (isNaN(fee) || fee < 0) {
      toast.error('Monthly fee must be a non-negative number')
      return
    }
    if (isNaN(returned) || returned < 0) {
      toast.error('Loan returned must be a non-negative number')
      return
    }
    if (isNaN(issued) || issued < 0) {
      toast.error('Loan issued must be a non-negative number')
      return
    }

    setSaving(true)
    const result = await upsertRecord({
      memberId,
      year,
      month,
      monthlyFee: fee,
      loanReturned: returned,
      loanIssued: issued,
      remarks: remarks.trim() || undefined,
    })
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Record saved and future months recalculated')
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
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{memberName}</h2>
            <p className="text-sm text-muted-foreground">
              {MONTHS[month - 1]} {year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthlyFee">Monthly Fee</Label>
              <Input
                id="monthlyFee"
                type="number"
                step="1"
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                className="h-11 text-base"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loanReturned">Loan Returned</Label>
              <Input
                id="loanReturned"
                type="number"
                step="1"
                min="0"
                value={loanReturned}
                onChange={(e) => setLoanReturned(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loanIssued">Loan Issued</Label>
              <Input
                id="loanIssued"
                type="number"
                step="1"
                min="0"
                value={loanIssued}
                onChange={(e) => setLoanIssued(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks..."
                className="h-11 text-base"
              />
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="w-4 h-4" />
                <span className="font-medium">Calculated values</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Previous Balance of Credit</span>
                <span className="font-mono font-medium">
                  {formatAmount(preview.previousBalanceOfCredit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount In Hand</span>
                <span className="font-mono font-bold text-primary">
                  {formatAmount(preview.amountInHand)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance of Credit</span>
                <span className="font-mono font-bold text-primary">
                  {formatAmount(preview.balanceOfCredit)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Saving will automatically recalculate this and all future months for
              this member.
            </p>

            <div className="flex gap-3">
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
                ) : (
                  'Save Record'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
