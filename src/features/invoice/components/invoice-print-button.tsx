'use client'

import { Button } from '@/components/ui/button'

export function InvoicePrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      Télécharger la facture
    </Button>
  )
}
