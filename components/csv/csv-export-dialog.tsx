'use client'

import { useState } from 'react'
import { getAllRecordsForExport } from '@/app/actions/records'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatAmountCsv } from '@/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EXPORT_HEADERS = [
  'Sr No',
  'Member Name',
  'Amount In Hand',
  'Monthly Fee',
  'Loan Returned',
  'Balance of Credit',
  'Loan Issued',
] as const

type ExportRow = {
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

interface Props {
  year: number
  month: number
}

function parseWhole(value: string | null | undefined): number {
  return Math.round(parseFloat(value || '0') || 0)
}

function sumTotals(rows: ExportRow[]) {
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

function getHeading(
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  if (filter === 'month') {
    return `Statement Account For the Month Of ${MONTHS[month - 1]} ${year}`
  }
  if (filter === 'year') {
    return `Statement Account For the Year ${year}`
  }
  return `Statement Account - All Historical Data`
}

function getExportDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function toCsv(
  rows: ExportRow[],
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  const titleBlock = [
    `"${getHeading(filter, year, month)}"`,
    `"Exported Date: ${getExportDate()}"`,
    '',
  ]

  const header = EXPORT_HEADERS.join(',')

  const lines = rows.map((r, idx) =>
    [
      idx + 1,
      `"${r.memberName.replace(/"/g, '""')}"`,
      formatAmountCsv(r.amountInHand),
      formatAmountCsv(r.monthlyFee),
      formatAmountCsv(r.loanReturned),
      formatAmountCsv(r.balanceOfCredit),
      formatAmountCsv(r.loanIssued),
    ].join(',')
  )

  const totals = sumTotals(rows)
  const totalsLine = [
    `""`,
    `"Total"`,
    totals.amountInHand,
    totals.monthlyFee,
    totals.loanReturned,
    totals.balanceOfCredit,
    totals.loanIssued,
  ].join(',')

  return [...titleBlock, header, ...lines, '', totalsLine].join('\n')
}

async function exportToExcel(
  rows: ExportRow[],
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Statement')

  worksheet.views = [{ showGridLines: true }]

  const titleRow = worksheet.addRow([getHeading(filter, year, month)])
  titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF0F172A' } }
  worksheet.mergeCells('A1:G1')
  titleRow.height = 32

  const dateRow = worksheet.addRow([`Exported Date: ${getExportDate()}`])
  dateRow.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF64748B' } }
  worksheet.mergeCells('A2:G2')
  dateRow.height = 22

  worksheet.addRow([])

  const headerRow = worksheet.addRow([...EXPORT_HEADERS])
  headerRow.height = 28

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } },
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber <= 2 ? (colNumber === 1 ? 'center' : 'left') : 'right',
    }
  })

  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 1
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
    row.height = 22

    row.eachCell((cell, colNumber) => {
      const highlightLoanIssued = colNumber === 7 && loanIssNum > 1
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: highlightLoanIssued,
        color: highlightLoanIssued ? { argb: 'FF15803D' } : { argb: 'FF0F172A' },
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }

      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
      }

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      } else {
        cell.numFmt = '#,##0'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
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
  totalRow.height = 26

  totalRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'double', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }

    if (colNumber === 1) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    } else if (colNumber === 2) {
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    } else {
      cell.numFmt = '#,##0'
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
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
    column.width = Math.max(maxLength + 4, 12)
  })

  worksheet.getColumn(1).width = 10
  worksheet.getColumn(2).width = 28

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const filename =
    filter === 'month'
      ? `records-${MONTHS[month - 1]}-${year}.xlsx`
      : filter === 'year'
        ? `records-${year}.xlsx`
        : `records-all.xlsx`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function exportToPdf(
  rows: ExportRow[],
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF('portrait', 'mm', 'a4')

  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(getHeading(filter, year, month), 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Exported Date: ${getExportDate()}`, 14, 28)

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
    startY: 34,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'right',
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'left' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: function (data) {
      const isTotalRow = data.row.index === tableRows.length - 1
      if (isTotalRow && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249]
        data.cell.styles.textColor = [15, 23, 42]
        return
      }

      // Loan Issued column — green + bold when value > 1
      if (data.section === 'body' && data.column.index === 6 && !isTotalRow) {
        const loanIssued = parseWhole(rows[data.row.index]?.loanIssued)
        if (loanIssued > 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [21, 128, 61] // green-700
        }
      }
    },
  })

  const filename =
    filter === 'month'
      ? `records-${MONTHS[month - 1]}-${year}.pdf`
      : filter === 'year'
        ? `records-${year}.pdf`
        : `records-all.pdf`

  doc.save(filename)
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function CsvExportDialog({ year, month }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('pdf')

  async function handleExport(filter: 'month' | 'year' | 'all') {
    setLoading(true)
    try {
      const rows = await getAllRecordsForExport(filter, year, month)
      if (rows.length === 0) {
        toast.info('No records to export for the selected range')
        setOpen(false)
        return
      }

      if (format === 'xlsx') {
        await exportToExcel(rows, filter, year, month)
      } else if (format === 'pdf') {
        await exportToPdf(rows, filter, year, month)
      } else {
        const csv = toCsv(rows, filter, year, month)
        const name =
          filter === 'month'
            ? `records-${MONTHS[month - 1]}-${year}.csv`
            : filter === 'year'
              ? `records-${year}.csv`
              : `records-all.csv`
        downloadCsv(csv, name)
      }

      toast.success(`Exported ${rows.length} records`)
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 mt-10"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-5 mt-72">
            <h2 className="text-lg font-bold text-foreground mb-1">Export Records</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose output format and range to download.
            </p>

            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4 border border-border/50">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  format === 'xlsx'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  format === 'csv'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                CSV (.csv)
              </button>
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  format === 'pdf'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                PDF (.pdf)
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => handleExport('month')}
                disabled={loading}
                variant="outline"
                className="w-full h-11 justify-start gap-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {MONTHS[month - 1]} {year}
              </Button>
              <Button
                onClick={() => handleExport('year')}
                disabled={loading}
                variant="outline"
                className="w-full h-11 justify-start gap-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                All of {year}
              </Button>
              <Button
                onClick={() => handleExport('all')}
                disabled={loading}
                variant="outline"
                className="w-full h-11 justify-start gap-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                All Historical Data
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full h-11"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
