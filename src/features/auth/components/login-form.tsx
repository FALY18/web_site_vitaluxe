'use client'

import { useActionState } from 'react'
import { login } from '../action/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { LoginState } from '../types'

const initial: LoginState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">Connexion</CardTitle>
        <CardDescription>Accès réservé au personnel VITALUXE</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="identifiant" className="text-sm font-medium">
              Identifiant
            </label>
            <Input
              id="identifiant"
              name="identifiant"
              autoComplete="username"
              required
              placeholder="ex: admin"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="motDePasse" className="text-sm font-medium">
              Mot de passe
            </label>
            <Input
              id="motDePasse"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full mt-1" size="lg">
            {pending ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
