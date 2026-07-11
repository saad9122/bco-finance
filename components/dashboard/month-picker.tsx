'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function MonthPicker({ year, month, onChange }: Props) {
  function prev() {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }

  function next() {
    if (month === 12) onChange(year + 1, 1)
    else onChange(year, month + 1)
  }

  return (
    <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={prev}
        aria-label="Previous month"
        className="h-9 w-9 rounded-lg"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="text-center">
        <p className="text-lg font-bold text-foreground leading-tight">
          {MONTHS[month - 1]}
        </p>
        <p className="text-sm text-muted-foreground">{year}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={next}
        aria-label="Next month"
        className="h-9 w-9 rounded-lg"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
