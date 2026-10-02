import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { SessionUser } from './types/index'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'vitaluxe-secret-dev')
const COOKIE = 'vtlx_session'

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(SECRET)

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
