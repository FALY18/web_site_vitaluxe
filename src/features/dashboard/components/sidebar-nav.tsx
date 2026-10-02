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
} from 'lucide-react'
import type { Role } from '@/features/auth/types'

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'commercial', 'depot'] },
  { href: '/dashboard/ventes', label: 'Ventes', icon: ShoppingCart, roles: ['admin', 'commercial'] },
  { href: '/dashboard/articles', label: 'Articles', icon: Package, roles: ['admin', 'commercial', 'depot'] },
  { href: '/dashboard/stock', label: 'Stock', icon: Layers, roles: ['admin', 'depot'] },
  { href: '/dashboard/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings, roles: ['admin'] },
] as const

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const nav = NAV.filter((item) => item.roles.includes(role as never))

  return (
    <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active
                ? 'bg-[#c8a96e]/15 text-[#c8a96e] border border-[#c8a96e]/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
