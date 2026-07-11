import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '—'
  const n = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(n)) return '—'
  return Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function toWholeAmount(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '0'
  const n = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(n)) return '0'
  return String(Math.round(n))
}

export function formatAmountCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '0'
  const n = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(n)) return '0'
  return String(Math.round(n))
}
