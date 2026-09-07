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
    format: 'a3' as const,
  },

  /** Tight page margins so the table uses as much vertical space as possible */
  margin: {
    top: 6,
    right: 10,
    bottom: 6,
    left: 10,
  },

  title: {
    fontSize: 14,
    textColor: C.textPrimary,
    x: 10,
    y: 10,
  },

  table: {
    /** Starts just below the title */
    startY: 14,
    styles: {
      font: 'helvetica' as const,
      fontSize: 13,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      minCellHeight: 0,
      valign: 'middle' as const,
    },
    headStyles: {
      fillColor: [...C.primary] as [number, number, number],
      textColor: [...C.textOnPrimary] as [number, number, number],
      fontStyle: 'bold' as const,
      fontSize: 12,
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
      /** Member Name — slightly wider so names aren't cramped */
      1: {
        halign: 'left' as const,
        cellWidth: 50,
        cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      },
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
