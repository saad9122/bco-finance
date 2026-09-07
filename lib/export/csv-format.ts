/**
 * CSV export format tokens — structure / encoding (CSV has no visual styles).
 * Tweak delimiter, quoting, MIME, and title-block layout here.
 */

export const CSV_FORMAT = {
  delimiter: ',',
  lineEnding: '\n',
  mimeType: 'text/csv;charset=utf-8;',

  /** Wrap title / date / member names in double quotes */
  quoteFields: true,

  titleBlock: {
    /** Include blank line after the date row before headers */
    blankLineAfterDate: true,
  },

  totals: {
    /** Label cell for the totals row (column 2) */
    label: 'Total',
    /** Empty placeholder for Sr No column */
    srNoPlaceholder: '',
  },

  /** Blank line between last data row and totals */
  blankLineBeforeTotals: true,
} as const

export type CsvFormat = typeof CSV_FORMAT
