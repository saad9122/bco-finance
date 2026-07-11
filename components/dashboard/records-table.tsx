'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getMonthlyRecords,
  bulkUpsertMonthlyRecords,
} from '@/app/actions/records'
import { computeRecord } from '@/lib/calculations'
import { formatAmount, toWholeAmount } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Users } from 'lucide-react'
import { toast } from 'sonner'

type Row = Awaited<ReturnType<typeof getMonthlyRecords>>[number]

type Draft = {
  monthlyFee: string
  loanReturned: string
  loanIssued: string
  remarks: string
}

interface Props {
  year: number
  month: number
}

function parseNonNegative(value: string, label: string): number | null {
  const n = parseFloat(value)
  if (isNaN(n) || n < 0) {
    toast.error(`${label} must be a non-negative number`)
    return null
  }
  return Math.round(n)
}

function draftsFromRows(rows: Row[]): Map<number, Draft> {
  return new Map(
    rows.map(({ member, record }) => [
      member.id,
      {
        monthlyFee: toWholeAmount(record?.monthlyFee),
        loanReturned: toWholeAmount(record?.loanReturned),
        loanIssued: toWholeAmount(record?.loanIssued),
        remarks: record?.remarks ?? '',
      },
    ])
  )
}

function numberInputClassName() {
  return 'h-8 text-right font-mono text-sm px-2 min-w-[88px]'
}

export function RecordsTable({ year, month }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [drafts, setDrafts] = useState<Map<number, Draft>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMonthlyRecords(year, month)
      setRows(data)
      setDrafts(draftsFromRows(data))
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  function updateDraft(memberId: number, field: keyof Draft, value: string) {
    setDrafts((prev) => {
      const next = new Map(prev)
      const current = next.get(memberId)
      if (!current) return prev
      next.set(memberId, { ...current, [field]: value })
      return next
    })
  }

  function getPreview(row: Row, draft: Draft) {
    return computeRecord(
      {
        monthlyFee: parseFloat(draft.monthlyFee) || 0,
        loanReturned: parseFloat(draft.loanReturned) || 0,
        loanIssued: parseFloat(draft.loanIssued) || 0,
      },
      row.previousAmountInHand,
      row.previousBalanceOfCredit
    )
  }

  async function handleSaveAll() {
    const payload: Array<{
      memberId: number
      monthlyFee: number
      loanReturned: number
      loanIssued: number
      remarks?: string
    }> = []

    for (const row of rows) {
      const draft = drafts.get(row.member.id)
      if (!draft) continue

      const monthlyFee = parseNonNegative(draft.monthlyFee, 'Monthly fee')
      if (monthlyFee === null) return
      const loanReturned = parseNonNegative(draft.loanReturned, 'Loan returned')
      if (loanReturned === null) return
      const loanIssued = parseNonNegative(draft.loanIssued, 'Loan issued')
      if (loanIssued === null) return

      payload.push({
        memberId: row.member.id,
        monthlyFee,
        loanReturned,
        loanIssued,
        remarks: draft.remarks.trim() || undefined,
      })
    }

    setSaving(true)
    const result = await bulkUpsertMonthlyRecords(year, month, payload)
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(`Updated ${result.updated} records for this month`)
    await load()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading records...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Users className="w-12 h-12 opacity-30" />
        <div className="text-center">
          <p className="font-medium text-foreground">No active members</p>
          <p className="text-sm mt-1">Add members from the Members screen.</p>
        </div>
      </div>
    )
  }

  const previews = rows.map((row) => {
    const draft = drafts.get(row.member.id)!
    return getPreview(row, draft)
  })

  const totalAmountInHand = previews.reduce((s, p) => s + p.amountInHand, 0)
  const totalMonthlyFees = previews.reduce((s, p) => s + p.monthlyFee, 0)
  const totalBalanceOfCredit = previews.reduce((s, p) => s + p.balanceOfCredit, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total Amount In Hand
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {formatAmount(totalAmountInHand)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total Monthly Fees
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {formatAmount(totalMonthlyFees)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total Balance of Credit
            </p>
            <p className="text-xl font-bold text-primary mt-1">
              {formatAmount(totalBalanceOfCredit)}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="h-11 gap-2 font-semibold shrink-0"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Update All Records
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Edit monthly fee, loans, and remarks for each member, then click Update
        All Records once. Calculated fields update as you type.
      </p>

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row, i) => {
          const draft = drafts.get(row.member.id)!
          const preview = previews[i]
          return (
            <div
              key={row.member.id}
              className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3"
            >
              <div>
                <p className="font-semibold text-foreground">{row.member.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {row.member.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Amount In Hand</p>
                  <p className="font-bold text-primary">{formatAmount(preview.amountInHand)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Prev. Balance of Credit</p>
                  <p className="font-medium">{formatAmount(row.previousBalanceOfCredit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Balance of Credit</p>
                  <p className="font-bold text-primary">{formatAmount(preview.balanceOfCredit)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Monthly Fee</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={draft.monthlyFee}
                    onChange={(e) =>
                      updateDraft(row.member.id, 'monthlyFee', e.target.value)
                    }
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Loan Returned</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={draft.loanReturned}
                    onChange={(e) =>
                      updateDraft(row.member.id, 'loanReturned', e.target.value)
                    }
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Loan Issued</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={draft.loanIssued}
                    onChange={(e) =>
                      updateDraft(row.member.id, 'loanIssued', e.target.value)
                    }
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Remarks</label>
                  <Input
                    value={draft.remarks}
                    onChange={(e) =>
                      updateDraft(row.member.id, 'remarks', e.target.value)
                    }
                    className="h-9 mt-1"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden md:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  Member
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Amount In Hand
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Monthly Fee
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Prev. Balance of Credit
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Loan Returned
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Loan Issued
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                  Balance of Credit
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground min-w-[140px]">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const draft = drafts.get(row.member.id)!
                const preview = previews[i]
                return (
                  <tr
                    key={row.member.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-muted/10'
                    }`}
                  >
                    <td className="py-2 px-4">
                      <p className="font-medium text-foreground">{row.member.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {row.member.code}
                      </p>
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-semibold text-primary">
                      {formatAmount(preview.amountInHand)}
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={draft.monthlyFee}
                        onChange={(e) =>
                          updateDraft(row.member.id, 'monthlyFee', e.target.value)
                        }
                        className={numberInputClassName()}
                      />
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatAmount(row.previousBalanceOfCredit)}
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={draft.loanReturned}
                        onChange={(e) =>
                          updateDraft(row.member.id, 'loanReturned', e.target.value)
                        }
                        className={numberInputClassName()}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={draft.loanIssued}
                        onChange={(e) =>
                          updateDraft(row.member.id, 'loanIssued', e.target.value)
                        }
                        className={numberInputClassName()}
                      />
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-semibold text-primary">
                      {formatAmount(preview.balanceOfCredit)}
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={draft.remarks}
                        onChange={(e) =>
                          updateDraft(row.member.id, 'remarks', e.target.value)
                        }
                        placeholder="Optional"
                        className="h-8 text-sm min-w-[120px]"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
