export function fitInvoiceToPage(sheet: HTMLElement) {
  const content = sheet.querySelector<HTMLElement>('.invoice-print-content')
  if (!content) return
  content.style.setProperty('--invoice-print-scale', '1')
  const bounds = content.getBoundingClientRect()
  const scale = Math.min(1, sheet.clientHeight / Math.max(1, bounds.height), sheet.clientWidth / Math.max(1, bounds.width))
  // Leave a little space for browser rounding at the page boundary.
  content.style.setProperty('--invoice-print-scale', String(scale * 0.985))
}
