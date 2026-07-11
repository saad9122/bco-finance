'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { importMonthlyRecordsCsv } from '@/app/actions/records'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface ParsedRow {
  memberId: number
  monthlyFee: number
  loanReturned: number
  loanIssued: number
  _error?: string
}

interface Props {
  year: number
  month: number
  onImported: () => void
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function parseAmount(value: string | undefined, label: string, errors: string[]) {
  const n = Math.round(parseFloat(value ?? '0'))
  if (isNaN(n) || n < 0) {
    errors.push(`Invalid ${label}`)
    return 0
  }
  return n
}

function parseRowFromObject(row: Record<string, string>): ParsedRow {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value?.trim() ?? ''])
  )

  const errors: string[] = []
  const memberId = parseInt(
    normalized.memberid ?? normalized.id ?? '',
    10
  )
  const monthlyFee = parseAmount(
    normalized.monthlyfee ?? normalized.fee,
    'monthly fee',
    errors
  )
  const loanReturned = parseAmount(
    normalized.loanreturned ?? normalized.returned,
    'loan returned',
    errors
  )
  const loanIssued = parseAmount(
    normalized.loanissued ?? normalized.loadissued ?? normalized.issued,
    'loan issued',
    errors
  )

  if (isNaN(memberId) || memberId <= 0) {
    errors.push('Invalid member ID')
  }

  return {
    memberId: isNaN(memberId) ? 0 : memberId,
    monthlyFee,
    loanReturned,
    loanIssued,
    _error: errors.length > 0 ? errors.join(', ') : undefined,
  }
}

function parseRowFromArray(cells: string[]): ParsedRow {
  const errors: string[] = []
  const memberId = parseInt(cells[0]?.trim() ?? '', 10)
  const monthlyFee = parseAmount(cells[1], 'monthly fee', errors)
  const loanReturned = parseAmount(cells[2], 'loan returned', errors)
  const loanIssued = parseAmount(cells[3], 'loan issued', errors)

  if (isNaN(memberId) || memberId <= 0) {
    errors.push('Invalid member ID')
  }

  if (cells.length < 4) {
    errors.push('Expected 4 columns: memberId, monthlyFee, loanReturned, loanIssued')
  }

  return {
    memberId: isNaN(memberId) ? 0 : memberId,
    monthlyFee,
    loanReturned,
    loanIssued,
    _error: errors.length > 0 ? errors.join(', ') : undefined,
  }
}

function hasHeaderRow(firstRow: Record<string, string>) {
  return Object.keys(firstRow).some((key) => {
    const normalized = normalizeHeader(key)
    return (
      normalized === 'memberid' ||
      normalized === 'id' ||
      normalized === 'monthlyfee' ||
      normalized === 'loanreturned' ||
      normalized === 'loanissued' ||
      normalized === 'loadissued'
    )
  })
}

export function CsvImportDialog({ year, month, onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const objectRows = results.data as Record<string, string>[]
        if (objectRows.length === 0) {
          setPreview([])
          return
        }

        if (hasHeaderRow(objectRows[0])) {
          setPreview(objectRows.map((row) => parseRowFromObject(row)))
          return
        }

        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (positionalResults) => {
            const arrayRows = (positionalResults.data as string[][]).filter(
              (row) => row.some((cell) => cell?.trim())
            )
            setPreview(arrayRows.map((row) => parseRowFromArray(row)))
          },
        })
      },
    })
  }

  async function handleImport() {
    const validRows = preview.filter((r) => !r._error)
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setImporting(true)
    const result = await importMonthlyRecordsCsv(year, month, validRows)
    setImporting(false)

    if (result.errors.length > 0) {
      toast.warning(
        `Imported ${result.imported} records. ${result.errors.length} errors: ${result.errors[0]}`
      )
    } else {
      toast.success(`Successfully imported ${result.imported} records`)
    }

    setOpen(false)
    setPreview([])
    setFileName('')
    onImported()
  }

  function handleClose() {
    setOpen(false)
    setPreview([])
    setFileName('')
  }

  const validCount = preview.filter((r) => !r._error).length
  const errorCount = preview.filter((r) => r._error).length

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">Import CSV</h2>
                <p className="text-sm text-muted-foreground">
                  Import for {MONTHS[month - 1]} {year}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns (in order): memberId, monthlyFee, loanReturned,
                  loanIssued
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
                memberId,monthlyFee,loanReturned,loanIssued{'\n'}
                1,200,50,100{'\n'}
                2,150,0,0
              </div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {fileName || 'Click or drag to upload CSV'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Amount In Hand and Balance of Credit are calculated automatically
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </div>

              {preview.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    {validCount > 0 && (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {validCount} valid
                      </div>
                    )}
                    {errorCount > 0 && (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {errorCount} invalid (will be skipped)
                      </div>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                    {preview.slice(0, 20).map((row, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 text-xs flex items-start justify-between gap-2 ${
                          row._error
                            ? 'bg-destructive/5'
                            : 'bg-green-50 dark:bg-green-900/10'
                        }`}
                      >
                        <div>
                          <span className="font-medium">Member #{row.memberId}</span>
                          <span className="text-muted-foreground ml-2">
                            Fee: {row.monthlyFee}, Issued: {row.loanIssued}, Returned:{' '}
                            {row.loanReturned}
                          </span>
                        </div>
                        {row._error && (
                          <span className="text-destructive shrink-0">
                            {row._error}
                          </span>
                        )}
                      </div>
                    ))}
                    {preview.length > 20 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        ...and {preview.length - 20} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border flex gap-3 shrink-0">
              <Button variant="outline" onClick={handleClose} className="flex-1 h-11">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="flex-1 h-11 font-semibold"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  `Import ${validCount} Records`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
