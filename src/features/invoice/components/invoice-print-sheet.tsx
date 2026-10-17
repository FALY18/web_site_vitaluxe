'use client'

import { useEffect, useRef } from 'react'
import { fitInvoiceToPage } from '../lib/print-fit'

export function InvoicePrintSheet({ children }: { children: React.ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prepare = () => { if (sheet.current) fitInvoiceToPage(sheet.current) }
    const restore = () => sheet.current?.querySelector<HTMLElement>('.invoice-print-content')?.style.removeProperty('--invoice-print-scale')
    window.addEventListener('beforeprint', prepare)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', prepare)
      window.removeEventListener('afterprint', restore)
    }
  }, [])
  return <div ref={sheet} className="invoice-template invoice-premium"><div className="invoice-print-content grid gap-5 xl:grid-cols-2">{children}</div></div>
}
