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

interface Props {
  year: number
  month: number
}

function toCsv(
  rows: Array<{
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
  }>,
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  let heading = ''
  if (filter === 'month') {
    heading = `Statement Account For the Month Of ${MONTHS[month - 1]} ${year}`
  } else if (filter === 'year') {
    heading = `Statement Account For the Year ${year}`
  } else {
    heading = `Statement Account - All Historical Data`
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const titleBlock = [
    `"${heading}"`,
    `"Exported Date: ${dateStr}"`,
    '', // Empty spacer row
  ]

  const header =
    'Member Name,Amount In Hand,Monthly Fee,Loan Returned,Loan Issued,Balance of Credit,Remarks'

  const lines = rows.map((r) =>
    [
      `"${r.memberName.replace(/"/g, '""')}"`,
      formatAmountCsv(r.amountInHand),
      formatAmountCsv(r.monthlyFee),
      formatAmountCsv(r.loanReturned),
      formatAmountCsv(r.loanIssued),
      formatAmountCsv(r.balanceOfCredit),
      `"${(r.remarks ?? '').replace(/"/g, '""')}"`,
    ].join(',')
  )

  let totalAmountInHand = 0
  let totalMonthlyFee = 0
  let totalLoanReturned = 0
  let totalLoanIssued = 0
  let totalBalanceOfCredit = 0

  rows.forEach((r) => {
    totalAmountInHand += Math.round(parseFloat(r.amountInHand || '0') || 0)
    totalMonthlyFee += Math.round(parseFloat(r.monthlyFee || '0') || 0)
    totalLoanReturned += Math.round(parseFloat(r.loanReturned || '0') || 0)
    totalLoanIssued += Math.round(parseFloat(r.loanIssued || '0') || 0)
    totalBalanceOfCredit += Math.round(parseFloat(r.balanceOfCredit || '0') || 0)
  })

  const totalsLine = [
    `"Total"`,
    totalAmountInHand,
    totalMonthlyFee,
    totalLoanReturned,
    totalLoanIssued,
    totalBalanceOfCredit,
    `""`,
  ].join(',')

  return [...titleBlock, header, ...lines, '', totalsLine].join('\n')
}

async function exportToExcel(
  rows: Array<{
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
  }>,
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Statement')

  worksheet.views = [{ showGridLines: true }]

  let heading = ''
  if (filter === 'month') {
    heading = `Statement Account For the Month Of ${MONTHS[month - 1]} ${year}`
  } else if (filter === 'year') {
    heading = `Statement Account For the Year ${year}`
  } else {
    heading = `Statement Account - All Historical Data`
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Title Row
  const titleRow = worksheet.addRow([heading])
  titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF0F172A' } }
  worksheet.mergeCells('A1:G1')
  titleRow.height = 32

  // Subtitle/Date Row
  const dateRow = worksheet.addRow([`Exported Date: ${dateStr}`])
  dateRow.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF64748B' } }
  worksheet.mergeCells('A2:G2')
  dateRow.height = 22

  // Spacer
  worksheet.addRow([])

  // Header Row
  const headers = [
    'Member Name',
    'Amount In Hand',
    'Monthly Fee',
    'Loan Returned',
    'Loan Issued',
    'Balance of Credit',
    'Remarks',
  ]
  const headerRow = worksheet.addRow(headers)
  headerRow.height = 28

  // Style Header Row
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Professional Blue 900
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } }
    }
    cell.alignment = { vertical: 'middle', horizontal: cell.address.match(/^A\d+$/) ? 'left' : 'right' }
    if (cell.address.match(/^G\d+$/)) {
      cell.alignment.horizontal = 'left'
    }
  })

  // Data Rows
  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 1
    const amountInHandNum = Math.round(parseFloat(r.amountInHand || '0') || 0)
    const monthlyFeeNum = Math.round(parseFloat(r.monthlyFee || '0') || 0)
    const loanRetNum = Math.round(parseFloat(r.loanReturned || '0') || 0)
    const loanIssNum = Math.round(parseFloat(r.loanIssued || '0') || 0)
    const balCreditNum = Math.round(parseFloat(r.balanceOfCredit || '0') || 0)

    const rowData = [
      r.memberName,
      amountInHandNum,
      monthlyFeeNum,
      loanRetNum,
      loanIssNum,
      balCreditNum,
      r.remarks || '',
    ]

    const row = worksheet.addRow(rowData)
    row.height = 22

    // Styling data cells
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11 }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      }

      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // Slate 50 Zebra striping
        }
      }

      // Format Numbers
      if (colNumber >= 2 && colNumber <= 6) {
        cell.numFmt = '#,##0'
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
    })
  })

  // Spacer before Totals
  worksheet.addRow([])

  // Totals Row
  let totalAmountInHand = 0
  let totalMonthlyFee = 0
  let totalLoanReturned = 0
  let totalLoanIssued = 0
  let totalBalanceOfCredit = 0

  rows.forEach((r) => {
    totalAmountInHand += Math.round(parseFloat(r.amountInHand || '0') || 0)
    totalMonthlyFee += Math.round(parseFloat(r.monthlyFee || '0') || 0)
    totalLoanReturned += Math.round(parseFloat(r.loanReturned || '0') || 0)
    totalLoanIssued += Math.round(parseFloat(r.loanIssued || '0') || 0)
    totalBalanceOfCredit += Math.round(parseFloat(r.balanceOfCredit || '0') || 0)
  })

  const totalsData = [
    'Total',
    totalAmountInHand,
    totalMonthlyFee,
    totalLoanReturned,
    totalLoanIssued,
    totalBalanceOfCredit,
    '',
  ]

  const totalRow = worksheet.addRow(totalsData)
  totalRow.height = 26

  totalRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }, // Slate 100
    }

    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'double', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    }

    if (colNumber >= 2 && colNumber <= 6) {
      cell.numFmt = '#,##0'
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    }
  })

  // Auto-fit Columns
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

  worksheet.getColumn(7).width = 25

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
  rows: Array<{
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
  }>,
  filter: 'month' | 'year' | 'all',
  year: number,
  month: number
) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  let heading = ''
  if (filter === 'month') {
    heading = `Statement Account For the Month Of ${MONTHS[month - 1]} ${year}`
  } else if (filter === 'year') {
    heading = `Statement Account For the Year ${year}`
  } else {
    heading = `Statement Account - All Historical Data`
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Title
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.text(heading, 14, 22)
  
  // Date
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text(`Exported Date: ${dateStr}`, 14, 28)

  // Columns & Data
  const tableColumn = [
    'Sr No',
    'Member Name',
    'Amount In Hand',
    'Monthly Fee',
    'Loan Returned',
    'Loan Issued',
    'Balance of Credit',
    'Remarks',
  ]

  let totalAmountInHand = 0
  let totalMonthlyFee = 0
  let totalLoanReturned = 0
  let totalLoanIssued = 0
  let totalBalanceOfCredit = 0

  const tableRows: any[][] = []

  rows.forEach((r, idx) => {
    const amountInHandNum = Math.round(parseFloat(r.amountInHand || '0') || 0)
    const monthlyFeeNum = Math.round(parseFloat(r.monthlyFee || '0') || 0)
    const loanRetNum = Math.round(parseFloat(r.loanReturned || '0') || 0)
    const loanIssNum = Math.round(parseFloat(r.loanIssued || '0') || 0)
    const balCreditNum = Math.round(parseFloat(r.balanceOfCredit || '0') || 0)

    totalAmountInHand += amountInHandNum
    totalMonthlyFee += monthlyFeeNum
    totalLoanReturned += loanRetNum
    totalLoanIssued += loanIssNum
    totalBalanceOfCredit += balCreditNum

    tableRows.push([
      idx + 1,
      r.memberName,
      amountInHandNum.toLocaleString(),
      monthlyFeeNum.toLocaleString(),
      loanRetNum.toLocaleString(),
      loanIssNum.toLocaleString(),
      balCreditNum.toLocaleString(),
      r.remarks || '',
    ])
  })

  tableRows.push([
    '',
    'Total',
    totalAmountInHand.toLocaleString(),
    totalMonthlyFee.toLocaleString(),
    totalLoanReturned.toLocaleString(),
    totalLoanIssued.toLocaleString(),
    totalBalanceOfCredit.toLocaleString(),
    '',
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 34,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 138], // Blue 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'right',
    },
    bodyStyles: {
      textColor: [51, 65, 85], // Slate 700
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'center' }, // Sr No
      1: { halign: 'left' }, // Member Name
      7: { halign: 'left' }, // Remarks
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    didParseCell: function (data: any) {
      if (data.row.index === tableRows.length - 1) { // Total Row
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249] // Slate 100
        data.cell.styles.textColor = [15, 23, 42] // Slate 900
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

            {/* Format selector */}
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

