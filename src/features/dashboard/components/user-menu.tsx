'use client'

import { logout } from '@/features/auth/action/auth'
import { LogOut, User } from 'lucide-react'
import type { SessionUser } from '@/features/auth/types'

const roleLabel: Record<string, string> = {
  admin: 'Administrateur',
  commercial: 'Commercial',
  depot: 'Dépôt',
}

export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
      <div className="size-7 rounded-full bg-[#c8a96e]/20 border border-[#c8a96e]/40 flex items-center justify-center shrink-0">
        <User className="size-3.5 text-[#c8a96e]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{user.nom}</p>
        <p className="text-[10px] text-muted-foreground">{roleLabel[user.role]}</p>
      </div>
      <form action={logout}>
        <button type="submit" title="Déconnexion" aria-label="Se déconnecter" className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground">
          <LogOut aria-hidden="true" className="size-4" />
        </button>
      </form>
    </div>
  )
}
