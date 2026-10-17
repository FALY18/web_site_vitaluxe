'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Settings,
  UserRound,
  Grid2x2,
} from 'lucide-react'
import type { Role } from '@/features/auth/types'

const NAV = [
  { href: '/dashboard',              label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'commercial', 'depot'] },
  { href: '/ventes',       label: 'Ventes',          icon: ShoppingCart,    roles: ['admin', 'commercial'] },
  { href: '/clients',      label: 'Clients',         icon: UserRound,       roles: ['admin', 'commercial'] },
  { href: '/articles',     label: 'Articles',        icon: Package,         roles: ['admin', 'commercial', 'depot'] },
  { href: '/plateaux',     label: 'Plateaux',        icon: Grid2x2,         roles: ['admin', 'depot'] },
  { href: '/stock',        label: 'Stock',           icon: Layers,          roles: ['admin', 'depot'] },
  { href: '/utilisateurs', label: 'Utilisateurs',    icon: Users,           roles: ['admin'] },
  { href: '/parametres',   label: 'Paramètres',      icon: Settings,        roles: ['admin'] },
] as const

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const nav = NAV.filter((item) => item.roles.includes(role as never))

  return (
    <nav aria-label="Navigation principale" className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-[#c8a96e]/15 text-primary border border-[#c8a96e]/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent'
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
