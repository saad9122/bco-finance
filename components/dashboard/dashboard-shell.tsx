'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { MonthPicker } from '@/components/dashboard/month-picker'
import { RecordsTable } from '@/components/dashboard/records-table'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { CsvExportDialog } from '@/components/csv/csv-export-dialog'

interface Props {
  userName: string
}

export function DashboardShell({ userName }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col min-h-svh bg-background">
      <AppHeader
        userName={userName}
        title="Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <CsvImportDialog year={year} month={month} onImported={refresh} />
            <CsvExportDialog year={year} month={month} />
          </div>
        }
      />

      <main className="flex-1 px-4 pb-8 max-w-7xl mx-auto w-full">
        <div className="py-4">
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y)
              setMonth(m)
            }}
          />
        </div>

        <RecordsTable key={`${year}-${month}-${refreshKey}`} year={year} month={month} />
      </main>
    </div>
  )
}
