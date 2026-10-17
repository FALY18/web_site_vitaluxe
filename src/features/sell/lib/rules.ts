import type { ModeLigne, ModePaiement, StatutVente } from '../types'

export class SaleError extends Error {}

export function paymentMethod(value: unknown): ModePaiement {
  if (value === 'especes' || value === 'mobile_money' || value === 'virement' || value === 'cheque') return value
  throw new SaleError('Choisissez un mode de paiement valide.')
}

function moneyCents(value: string) {
  decimal(value, 'Montant')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'))
}

export function paymentBalance(total: string, received: string) {
  const remaining = moneyCents(total) - moneyCents(received)
  if (remaining < BigInt(0)) throw new SaleError('Les règlements dépassent le total de la facture. Vérifiez le dossier.')
  return { montantPaye: Number(moneyCents(received)) / 100, resteAPayer: Number(remaining) / 100 }
}

export function paymentOutcome(total: string, received: string, amount: string) {
  const cents = moneyCents(amount)
  if (cents <= BigInt(0)) throw new SaleError('Le montant reçu doit être strictement positif.')
  const newReceived = moneyCents(received) + cents
  if (newReceived > moneyCents(total)) throw new SaleError('Le montant reçu dépasse le solde de la facture.')
  return {
    montantPaye: (Number(newReceived) / 100).toFixed(2),
    resteAPayer: (Number(moneyCents(total) - newReceived) / 100).toFixed(2),
    statut: newReceived === moneyCents(total) ? 'payee' as const : 'partielle' as const,
  }
}

export function validPaymentDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new SaleError('Date de règlement invalide.')
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date())
  if (value > today) throw new SaleError('Un règlement reçu ne peut pas être daté dans le futur.')
  return value
}

// Work in hundredths of m², matching plateau.surfaceRestanteM2, not the original area.
export function surfaceAfterSale(current: string, sold: number) {
  const available = decimal(current, 'Surface restante', 99999999.99)
  if (!Number.isFinite(sold) || sold <= 0 || sold > 99999999.99) throw new SaleError('Surface vendue invalide.')
  const remaining = Math.round(available * 100) - Math.round(sold * 100)
  if (Math.round(sold * 100) === 0) throw new SaleError('Surface vendue inférieure à 0,01 m².')
  if (remaining < 0) throw new SaleError(`Surface insuffisante : ${current} m² disponibles.`)
  return (remaining / 100).toFixed(2)
}

export function surfaceAfterRestoration(current: string, restored: number) {
  const available = decimal(current, 'Surface restante', 99999999.99)
  if (!Number.isFinite(restored) || restored <= 0) throw new SaleError('Surface à restituer invalide.')
  const remaining = Math.round(available * 100) + Math.round(restored * 100)
  if (remaining > 9999999999) throw new SaleError('Surface restaurée hors limites.')
  return (remaining / 100).toFixed(2)
}

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
