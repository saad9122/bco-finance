/**
 * Export module entry — re-exports generators + style tokens.
 *
 * Style control surfaces (edit these to change look):
 *   - colors.ts        shared palette (Excel ARGB + PDF RGB)
 *   - excel-styles.ts  fonts, sizes, row heights, borders, fills
 *   - pdf-styles.ts    page, title, autoTable fonts/colors
 *   - csv-format.ts    delimiter, quoting, MIME (no visual styles)
 */

export { EXPORT_COLORS_ARGB, EXPORT_COLORS_RGB } from './colors'
export { EXCEL_STYLES } from './excel-styles'
export { PDF_STYLES } from './pdf-styles'
export { CSV_FORMAT } from './csv-format'
export {
  MONTHS,
  EXPORT_HEADERS,
  EXPORT_COLUMNS,
  LOAN_ISSUED_HIGHLIGHT_THRESHOLD,
  type ExportFilter,
  type ExportRow,
  type ExportTotals,
  getHeading,
  getExportDate,
  getExportFilename,
  parseWhole,
  sumTotals,
} from './shared'

export { exportToCsv, toCsv, downloadCsv } from './export-csv'
export { exportToExcel } from './export-excel'
export { exportToPdf } from './export-pdf'
