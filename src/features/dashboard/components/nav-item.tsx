'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItem } from '../types'

export function NavItem({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
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
}
