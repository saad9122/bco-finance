import { PDF_STYLES as S } from './pdf-styles'
import {
  EXPORT_COLUMNS,
  EXPORT_HEADERS,
  LOAN_ISSUED_HIGHLIGHT_THRESHOLD,
  type ExportFilter,
  type ExportRow,
  getExportFilename,
  getHeading,
  parseWhole,
  sumTotals,
} from './shared'

export async function exportToPdf(
  rows: ExportRow[],
  filter: ExportFilter,
  year: number,
  month: number
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF(S.page.orientation, S.page.unit, S.page.format)

  doc.setFontSize(S.title.fontSize)
  doc.setTextColor(...S.title.textColor)
  doc.text(getHeading(filter, year, month), S.title.x, S.title.y)

  const totals = sumTotals(rows)
  const tableRows: (string | number)[][] = []

  rows.forEach((r, idx) => {
    const amountInHandNum = parseWhole(r.amountInHand)
    const monthlyFeeNum = parseWhole(r.monthlyFee)
    const loanRetNum = parseWhole(r.loanReturned)
    const balCreditNum = parseWhole(r.balanceOfCredit)
    const loanIssNum = parseWhole(r.loanIssued)

    tableRows.push([
      idx + 1,
      r.memberName,
      amountInHandNum.toLocaleString(),
      monthlyFeeNum.toLocaleString(),
      loanRetNum.toLocaleString(),
      balCreditNum.toLocaleString(),
      loanIssNum.toLocaleString(),
    ])
  })

  tableRows.push([
    '',
    'Total',
    totals.amountInHand.toLocaleString(),
    totals.monthlyFee.toLocaleString(),
    totals.loanReturned.toLocaleString(),
    totals.balanceOfCredit.toLocaleString(),
    totals.loanIssued.toLocaleString(),
  ])

  autoTable(doc, {
    head: [[...EXPORT_HEADERS]],
    body: tableRows,
    startY: S.table.startY,
    margin: { ...S.margin },
    styles: { ...S.table.styles },
    headStyles: { ...S.table.headStyles },
    bodyStyles: { ...S.table.bodyStyles },
    columnStyles: { ...S.table.columnStyles },
    alternateRowStyles: { ...S.table.alternateRowStyles },
    didParseCell: function (data) {
      const isTotalRow = data.row.index === tableRows.length - 1
      if (isTotalRow && data.section === 'body') {
        data.cell.styles.fontStyle = S.totalsRow.fontStyle
        data.cell.styles.fillColor = [...S.totalsRow.fillColor]
        data.cell.styles.textColor = [...S.totalsRow.textColor]
        return
      }

      if (
        data.section === 'body' &&
        data.column.index === EXPORT_COLUMNS.loanIssued.pdf &&
        !isTotalRow
      ) {
        const loanIssued = parseWhole(rows[data.row.index]?.loanIssued)
        if (loanIssued > LOAN_ISSUED_HIGHLIGHT_THRESHOLD) {
          data.cell.styles.fontStyle = S.highlightLoanIssued.fontStyle
          data.cell.styles.textColor = [...S.highlightLoanIssued.textColor]
        }
      }
    },
  })

  doc.save(getExportFilename(filter, year, month, 'pdf'))
}
