import { EXCEL_STYLES as S } from './excel-styles'
import {
  EXPORT_COLUMNS,
  EXPORT_HEADERS,
  LOAN_ISSUED_HIGHLIGHT_THRESHOLD,
  type ExportFilter,
  type ExportRow,
  getExportDate,
  getExportFilename,
  getHeading,
  parseWhole,
  sumTotals,
} from './shared'

function horizontalAlign(colNumber: number): 'center' | 'left' | 'right' {
  if (colNumber === EXPORT_COLUMNS.srNo.excel) return 'center'
  if (colNumber === EXPORT_COLUMNS.memberName.excel) return 'left'
  return 'right'
}

export async function exportToExcel(
  rows: ExportRow[],
  filter: ExportFilter,
  year: number,
  month: number
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(S.sheet.name)

  worksheet.views = [{ showGridLines: S.sheet.showGridLines }]

  const mergeEnd = S.sheet.mergeRangeEnd

  const titleRow = worksheet.addRow([getHeading(filter, year, month)])
  titleRow.font = { ...S.title.font }
  worksheet.mergeCells(`A1:${mergeEnd}1`)
  titleRow.height = S.title.height

  const dateRow = worksheet.addRow([`Exported Date: ${getExportDate()}`])
  dateRow.font = { ...S.date.font }
  worksheet.mergeCells(`A2:${mergeEnd}2`)
  dateRow.height = S.date.height

  worksheet.addRow([])

  const headerRow = worksheet.addRow([...EXPORT_HEADERS])
  headerRow.height = S.header.height

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { ...S.header.font }
    cell.fill = { ...S.header.fill }
    cell.border = { ...S.header.border }
    cell.alignment = {
      vertical: 'middle',
      horizontal: horizontalAlign(colNumber),
    }
  })

  rows.forEach((r, idx) => {
    const isAlternate = idx % 2 === 1
    const amountInHandNum = parseWhole(r.amountInHand)
    const monthlyFeeNum = parseWhole(r.monthlyFee)
    const loanRetNum = parseWhole(r.loanReturned)
    const balCreditNum = parseWhole(r.balanceOfCredit)
    const loanIssNum = parseWhole(r.loanIssued)

    const row = worksheet.addRow([
      idx + 1,
      r.memberName,
      amountInHandNum,
      monthlyFeeNum,
      loanRetNum,
      balCreditNum,
      loanIssNum,
    ])
    row.height = S.body.height

    row.eachCell((cell, colNumber) => {
      const highlightLoanIssued =
        colNumber === EXPORT_COLUMNS.loanIssued.excel &&
        loanIssNum > LOAN_ISSUED_HIGHLIGHT_THRESHOLD

      cell.font = {
        name: S.body.font.name,
        size: S.body.font.size,
        bold: highlightLoanIssued
          ? S.body.highlightLoanIssued.bold
          : S.body.font.bold,
        color: highlightLoanIssued
          ? { ...S.body.highlightLoanIssued.color }
          : { ...S.body.font.color },
      }
      cell.border = { ...S.body.border }

      if (isAlternate) {
        cell.fill = { ...S.body.alternateRowFill }
      }

      cell.alignment = {
        vertical: 'middle',
        horizontal: horizontalAlign(colNumber),
      }

      if (colNumber > EXPORT_COLUMNS.memberName.excel) {
        cell.numFmt = S.numberFormat
      }
    })
  })

  worksheet.addRow([])

  const totals = sumTotals(rows)
  const totalRow = worksheet.addRow([
    '',
    'Total',
    totals.amountInHand,
    totals.monthlyFee,
    totals.loanReturned,
    totals.balanceOfCredit,
    totals.loanIssued,
  ])
  totalRow.height = S.totals.height

  totalRow.eachCell((cell, colNumber) => {
    cell.font = { ...S.totals.font }
    cell.fill = { ...S.totals.fill }
    cell.border = { ...S.totals.border }
    cell.alignment = {
      vertical: 'middle',
      horizontal: horizontalAlign(colNumber),
    }

    if (colNumber > EXPORT_COLUMNS.memberName.excel) {
      cell.numFmt = S.numberFormat
    }
  })

  worksheet.columns.forEach((column) => {
    let maxLength = 0
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? String(cell.value) : ''
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length
      }
    })
    column.width = Math.max(
      maxLength + S.columnWidths.autoPadding,
      S.columnWidths.autoMinWidth
    )
  })

  worksheet.getColumn(EXPORT_COLUMNS.srNo.excel).width = S.columnWidths.srNo
  worksheet.getColumn(EXPORT_COLUMNS.memberName.excel).width =
    S.columnWidths.memberName

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: S.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = getExportFilename(filter, year, month, 'xlsx')
  a.click()
  URL.revokeObjectURL(url)
}
