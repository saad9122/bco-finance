/**
 * PDF export style tokens — single control surface for jsPDF + autoTable.
 * Colors come from ./colors; tweak page layout, fonts, and table styles here.
 */

import { EXPORT_COLORS_RGB } from './colors'

const C = EXPORT_COLORS_RGB

export const PDF_STYLES = {
  page: {
    orientation: 'portrait' as const,
    unit: 'mm' as const,
    format: 'a4' as const,
  },

  title: {
    fontSize: 16,
    textColor: C.textPrimary,
    x: 14,
    y: 22,
  },

  date: {
    fontSize: 10,
    textColor: C.textMuted,
    x: 14,
    y: 28,
  },

  table: {
    startY: 34,
    styles: {
      font: 'helvetica' as const,
      fontSize: 12,
      /** No vertical padding — keeps rows compact so the table fits one page */
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      minCellHeight: 0,
      valign: 'middle' as const,
    },
    headStyles: {
      fillColor: [...C.primary] as [number, number, number],
      textColor: [...C.textOnPrimary] as [number, number, number],
      fontStyle: 'bold' as const,
      fontSize: 10,
      halign: 'right' as const,
      cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
    },
    bodyStyles: {
      textColor: [...C.textBody] as [number, number, number],
      halign: 'right' as const,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
    },
    columnStyles: {
      0: { halign: 'center' as const },
      1: { halign: 'left' as const },
    },
    alternateRowStyles: {
      fillColor: [...C.rowAlternate] as [number, number, number],
    },
  },

  totalsRow: {
    fontStyle: 'bold' as const,
    fillColor: [...C.totalsFill] as [number, number, number],
    textColor: [...C.textPrimary] as [number, number, number],
  },

  highlightLoanIssued: {
    fontStyle: 'bold' as const,
    textColor: [...C.highlightPositive] as [number, number, number],
  },
} as const

export type PdfStyles = typeof PDF_STYLES
