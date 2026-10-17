import type { ModeLigne, StatutVente } from '../types'

export class SaleError extends Error {}

export function modesForArticle(type: string, hasWholesale = false): ModeLigne[] {
  if (type === 'vitre') return hasWholesale ? ['decoupe', 'plateau_entier', 'plateau_gros'] : ['decoupe', 'plateau_entier']
  if (type === 'alu') return ['barre', 'pack']
  return ['standard']
}

export function positiveInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) throw new SaleError(`${label} doit être un entier positif.`)
  return value
}

export function decimal(value: unknown, label: string, maximum = 999999999999.99) {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) > maximum) {
    throw new SaleError(`${label} : saisissez un montant positif avec au plus deux décimales.`)
  }
  return Number(value)
}

export function dimension(value: unknown, label: string) {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,3})?$/.test(value) || Number(value) <= 0 || Number(value) > 999.999) {
    throw new SaleError(`${label} : valeur entre 0,001 et 999,999 m (trois décimales maximum).`)
  }
  return Number(value)
}

// Match numeric(10,2) quantity and numeric(14,2) monetary storage.
export function lineAmounts(quantity: number, price: string) {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 99999999.99) throw new SaleError('Quantité facturée hors limites.')
  const quantityHundredths = BigInt(Math.round(quantity * 100))
  if (quantityHundredths === BigInt(0)) throw new SaleError('La surface facturable doit atteindre 0,01 m².')
  decimal(price, 'Prix')
  const priceCents = BigInt(price.split('.')[0]) * BigInt(100) + BigInt((price.split('.')[1] ?? '').padEnd(2, '0'))
  const totalCents = (quantityHundredths * priceCents + BigInt(50)) / BigInt(100)
  if (totalCents > BigInt('99999999999999')) throw new SaleError('Montant de ligne trop élevé.')
  return { quantiteFacturee: (Number(quantityHundredths) / 100).toFixed(2), montant: (Number(totalCents) / 100).toFixed(2) }
}

export function cutFits(length: number, height: number, originalLength: number, originalHeight: number, tolerance: number) {
  return (length <= originalLength + tolerance && height <= originalHeight + tolerance)
    || (height <= originalLength + tolerance && length <= originalHeight + tolerance)
}

export function cutQuantity(length: number, height: number, count: number) {
  const squareMillimeters = BigInt(Math.round(length * 1000)) * BigInt(Math.round(height * 1000)) * BigInt(count)
  // 10,000 mm² = 0.01 m². Round once, identically in preview and persistence.
  return Number((squareMillimeters + BigInt(5000)) / BigInt(10000)) / 100
}

export function canTransition(from: StatutVente, to: StatutVente) {
  return (from === 'brouillon' && (to === 'confirmee' || to === 'annulee'))
    || (from === 'confirmee' && (to === 'livree' || to === 'annulee'))
}
