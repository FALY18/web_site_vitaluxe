import { SignJWT, jwtVerify } from 'jose'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { SaleError, positiveInteger } from '@/features/sell/lib/rules'

const key = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'vitaluxe-secret-dev')

// Reserve an existing serial ID and sign it; no extra column/table is needed.
// Replaying a submitted token targets the same payment primary key.
export async function issuePaymentToken(venteId: number, userId: number) {
  const result = await db.execute<{ id: number }>(sql`SELECT nextval(pg_get_serial_sequence('paiement', 'id'))::int AS id`)
  return new SignJWT({ paymentId: result.rows[0].id, venteId, userId })
    .setProtectedHeader({ alg: 'HS256' }).setAudience('vitaluxe-payment').setIssuedAt().setExpirationTime('12h').sign(key())
}

export async function verifyPaymentToken(value: unknown, venteId: number, userId: number) {
  try {
    if (typeof value !== 'string') throw new Error('missing')
    const { payload } = await jwtVerify(value, key(), { algorithms: ['HS256'], audience: 'vitaluxe-payment' })
    if (payload.venteId !== venteId || payload.userId !== userId) throw new Error('mismatch')
    return positiveInteger(Number(payload.paymentId), 'Référence de règlement')
  } catch { throw new SaleError('Le formulaire de règlement a expiré. Actualisez la page avant de réessayer.') }
}
