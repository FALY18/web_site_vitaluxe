import type { Role } from '@/features/auth/types'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
}

export type StatCardData = {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}
