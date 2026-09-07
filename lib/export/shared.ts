/**
 * Shared export content helpers (headers, labels, totals).
 * Style tokens live in excel-styles / pdf-styles / csv-format.
 */

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const EXPORT_HEADERS = [
  'Sr No',
  'Member Name',
  'Amount In Hand',
  'Monthly Fee',
  'Loan Returned',
  'Balance of Credit',
  'Loan Issued',
] as const

export type ExportFilter = 'month' | 'year' | 'all'

export type ExportRow = {
  memberName: string
  memberCode: string
  year: number
  month: number
  amountInHand: string | null
  monthlyFee: string | null
  previousBalanceOfCredit: string
  loanReturned: string | null
  loanIssued: string | null
  balanceOfCredit: string | null
  remarks: string | null
}

export type ExportTotals = {
  amountInHand: number
  monthlyFee: number
  loanReturned: number
  loanIssued: number
  balanceOfCredit: number
}

export function parseWhole(value: string | null | undefined): number {
  return Math.round(parseFloat(value || '0') || 0)
}

export function sumTotals(rows: ExportRow[]): ExportTotals {
  return rows.reduce(
    (acc, r) => {
      acc.amountInHand += parseWhole(r.amountInHand)
      acc.monthlyFee += parseWhole(r.monthlyFee)
      acc.loanReturned += parseWhole(r.loanReturned)
      acc.loanIssued += parseWhole(r.loanIssued)
      acc.balanceOfCredit += parseWhole(r.balanceOfCredit)
      return acc
    },
    {
      amountInHand: 0,
      monthlyFee: 0,
      loanReturned: 0,
      loanIssued: 0,
      balanceOfCredit: 0,
    }
  )
}

export function getHeading(
  filter: ExportFilter,
  year: number,
  month: number
): string {
  if (filter === 'month') {
    return `Statement Account For the Month Of ${MONTHS[month - 1]} ${year}`
  }
  if (filter === 'year') {
    return `Statement Account For the Year ${year}`
  }
  return `Statement Account - All Historical Data`
}

export function getExportDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getExportFilename(
  filter: ExportFilter,
  year: number,
  month: number,
  extension: 'csv' | 'xlsx' | 'pdf'
): string {
  if (filter === 'month') {
    return `records-${MONTHS[month - 1]}-${year}.${extension}`
  }
  if (filter === 'year') {
    return `records-${year}.${extension}`
  }
  return `records-all.${extension}`
}

/** Column indices (1-based for Excel, 0-based for PDF) */
export const EXPORT_COLUMNS = {
  srNo: { excel: 1, pdf: 0 },
  memberName: { excel: 2, pdf: 1 },
  amountInHand: { excel: 3, pdf: 2 },
  monthlyFee: { excel: 4, pdf: 3 },
  loanReturned: { excel: 5, pdf: 4 },
  balanceOfCredit: { excel: 6, pdf: 5 },
  loanIssued: { excel: 7, pdf: 6 },
} as const

/** Highlight loan issued cells when the numeric value exceeds this threshold */
export const LOAN_ISSUED_HIGHLIGHT_THRESHOLD = 1
