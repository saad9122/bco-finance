/**
 * Registers Atkinson Hyperlegible with jsPDF.
 * Designed by Braille Institute for maximum character distinction / visibility.
 */

import type { jsPDF } from 'jspdf'
import { PDF_STYLES } from './pdf-styles'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function loadFontAsBase64(path: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Failed to load PDF font: ${path}`)
  }
  return arrayBufferToBase64(await res.arrayBuffer())
}

export async function registerPdfFonts(doc: jsPDF): Promise<void> {
  const { family, files } = PDF_STYLES.font

  const [regular, bold] = await Promise.all([
    loadFontAsBase64(files.regular),
    loadFontAsBase64(files.bold),
  ])

  doc.addFileToVFS('AtkinsonHyperlegible-Regular.ttf', regular)
  doc.addFont('AtkinsonHyperlegible-Regular.ttf', family, 'normal')

  doc.addFileToVFS('AtkinsonHyperlegible-Bold.ttf', bold)
  doc.addFont('AtkinsonHyperlegible-Bold.ttf', family, 'bold')

  doc.setFont(family, 'normal')
}
