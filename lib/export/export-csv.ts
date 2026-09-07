import { formatAmountCsv } from '@/lib/utils'
import { CSV_FORMAT } from './csv-format'
import {
  EXPORT_HEADERS,
  type ExportFilter,
  type ExportRow,
  getExportDate,
  getExportFilename,
  getHeading,
  sumTotals,
} from './shared'

function quote(value: string): string {
  if (!CSV_FORMAT.quoteFields) return value
  return `"${value.replace(/"/g, '""')}"`
}

export function toCsv(
  rows: ExportRow[],
  filter: ExportFilter,
  year: number,
  month: number
): string {
  const { delimiter, lineEnding } = CSV_FORMAT

  const titleBlock = [
    quote(getHeading(filter, year, month)),
    quote(`Exported Date: ${getExportDate()}`),
  ]
  if (CSV_FORMAT.titleBlock.blankLineAfterDate) {
    titleBlock.push('')
  }

  const header = EXPORT_HEADERS.join(delimiter)

  const lines = rows.map((r, idx) =>
    [
      idx + 1,
      quote(r.memberName),
      formatAmountCsv(r.amountInHand),
      formatAmountCsv(r.monthlyFee),
      formatAmountCsv(r.loanReturned),
      formatAmountCsv(r.balanceOfCredit),
      formatAmountCsv(r.loanIssued),
    ].join(delimiter)
  )

  const totals = sumTotals(rows)
  const totalsLine = [
    quote(CSV_FORMAT.totals.srNoPlaceholder),
    quote(CSV_FORMAT.totals.label),
    totals.amountInHand,
    totals.monthlyFee,
    totals.loanReturned,
    totals.balanceOfCredit,
    totals.loanIssued,
  ].join(delimiter)

  const parts = [...titleBlock, header, ...lines]
  if (CSV_FORMAT.blankLineBeforeTotals) {
    parts.push('')
  }
  parts.push(totalsLine)

  return parts.join(lineEnding)
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: CSV_FORMAT.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportToCsv(
  rows: ExportRow[],
  filter: ExportFilter,
  year: number,
  month: number
): Promise<void> {
  const csv = toCsv(rows, filter, year, month)
  downloadCsv(csv, getExportFilename(filter, year, month, 'csv'))
}
