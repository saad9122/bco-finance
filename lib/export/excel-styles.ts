/**
 * Excel (.xlsx) export style tokens — single control surface for ExcelJS.
 * Colors come from ./colors; tweak fonts, sizes, heights, borders here.
 */

import { EXPORT_COLORS_ARGB } from './colors'

const C = EXPORT_COLORS_ARGB

export const EXCEL_STYLES = {
  sheet: {
    name: 'Statement',
    showGridLines: true,
    /** Last data column letter used for title/date merges (A:G = 7 cols) */
    mergeRangeEnd: 'G',
  },

  fontFamily: 'Calibri',

  numberFormat: '#,##0',

  columnWidths: {
    /** Fallback when auto-sizing: max(contentLen + padding, minWidth) */
    autoPadding: 4,
    autoMinWidth: 12,
    /** Fixed overrides after auto-size */
    srNo: 10,
    memberName: 28,
  },

  title: {
    font: {
      name: 'Calibri',
      size: 18,
      bold: true,
      color: { argb: C.textPrimary },
    },
    height: 32,
  },

  date: {
    font: {
      name: 'Calibri',
      size: 11,
      italic: true,
      color: { argb: C.textMuted },
    },
    height: 22,
  },

  header: {
    height: 28,
    font: {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: C.textOnPrimary },
    },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: C.primary },
    },
    border: {
      top: { style: 'thin' as const, color: { argb: C.primary } },
      bottom: { style: 'medium' as const, color: { argb: C.primary } },
      left: { style: 'thin' as const, color: { argb: C.primaryLight } },
      right: { style: 'thin' as const, color: { argb: C.primaryLight } },
    },
  },

  body: {
    height: 22,
    font: {
      name: 'Calibri',
      size: 11,
      bold: false,
      color: { argb: C.textPrimary },
    },
    /** Applied when loan issued > threshold */
    highlightLoanIssued: {
      bold: true,
      color: { argb: C.highlightPositive },
    },
    border: {
      bottom: { style: 'thin' as const, color: { argb: C.borderMuted } },
      right: { style: 'thin' as const, color: { argb: C.borderMuted } },
      left: { style: 'thin' as const, color: { argb: C.borderMuted } },
    },
    alternateRowFill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: C.rowAlternate },
    },
  },

  totals: {
    height: 26,
    font: {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: C.textPrimary },
    },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: C.totalsFill },
    },
    border: {
      top: { style: 'medium' as const, color: { argb: C.primary } },
      bottom: { style: 'double' as const, color: { argb: C.primary } },
      left: { style: 'thin' as const, color: { argb: C.borderMuted } },
      right: { style: 'thin' as const, color: { argb: C.borderMuted } },
    },
  },

  mimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const

export type ExcelStyles = typeof EXCEL_STYLES
