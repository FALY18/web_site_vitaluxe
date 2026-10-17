'use client'

import { logout } from '@/features/auth/action/auth'
import { LogOut, User } from 'lucide-react'
import type { SessionUser } from '@/features/auth/types'

const roleLabel: Record<string, string> = {
  admin: 'Administrateur',
  commercial: 'Commercial',
  depot: 'Dépôt',
}

export function UserMenu({ user, compact = false }: { user: SessionUser; compact?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-lg ${compact ? 'px-1' : 'border border-border bg-muted px-3 py-2.5'}`}>
      <div className={`${compact ? 'hidden sm:flex' : 'flex'} size-7 rounded-full bg-primary/10 border border-primary/30 items-center justify-center shrink-0`}>
        <User className="size-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{user.nom}</p>
        <p className="text-[10px] text-muted-foreground">{roleLabel[user.role]}</p>
      </div>
      <form action={logout}>
        <button type="submit" title="Déconnexion" aria-label="Se déconnecter" className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
          <LogOut aria-hidden="true" className="size-4" />
        </button>
      </form>
    </div>
  )
}
