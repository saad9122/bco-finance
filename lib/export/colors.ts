/**
 * Shared export color palette.
 * Edit here to keep Excel + PDF visually aligned.
 *
 * Values mirror Tailwind slate / blue / green scales.
 */

export type Rgb = readonly [number, number, number]

/** ARGB hex for ExcelJS (with FF alpha prefix) */
export const EXPORT_COLORS_ARGB = {
  /** slate-900 — titles, body text, totals text */
  textPrimary: 'FF0F172A',
  /** slate-500 — export date / muted text */
  textMuted: 'FF64748B',
  /** slate-700 — PDF body text */
  textBody: 'FF334155',
  /** white — header text */
  textOnPrimary: 'FFFFFFFF',
  /** blue-900 — header fill, strong borders */
  primary: 'FF1E3A8A',
  /** blue-500 — header side borders */
  primaryLight: 'FF3B82F6',
  /** slate-50 — alternate row fill */
  rowAlternate: 'FFF8FAFC',
  /** slate-100 — totals row fill */
  totalsFill: 'FFF1F5F9',
  /** slate-200 — body cell borders */
  borderMuted: 'FFE2E8F0',
  /** green-700 — loan issued highlight */
  highlightPositive: 'FF15803D',
} as const

/** RGB tuples for jsPDF / autoTable */
export const EXPORT_COLORS_RGB = {
  textPrimary: [15, 23, 42] as Rgb,
  textMuted: [100, 116, 139] as Rgb,
  textBody: [51, 65, 85] as Rgb,
  textOnPrimary: [255, 255, 255] as Rgb,
  primary: [30, 58, 138] as Rgb,
  primaryLight: [59, 130, 246] as Rgb,
  rowAlternate: [248, 250, 252] as Rgb,
  totalsFill: [241, 245, 249] as Rgb,
  borderMuted: [226, 232, 240] as Rgb,
  highlightPositive: [21, 128, 61] as Rgb,
} as const
