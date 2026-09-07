'use client'

import { useState } from 'react'
import { getAllRecordsForExport } from '@/app/actions/records'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  MONTHS,
  exportToCsv,
  exportToExcel,
  exportToPdf,
} from '@/lib/export'

interface Props {
  year: number
  month: number
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
        await exportToCsv(rows, filter, year, month)
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
