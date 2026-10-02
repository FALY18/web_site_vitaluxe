import Image from 'next/image'
import Link from 'next/link'
import { SidebarNav } from '@/features/dashboard/components/sidebar-nav'
import { UserMenu } from '@/features/dashboard/components/user-menu'
import { getSession } from '@/features/auth/session'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/8 bg-[#0d0d0d]">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div className="rounded-full p-0.5 ring-1 ring-[#c8a96e]/50">
            <Image src="/logo.jpeg" alt="VITALUXE" width={32} height={32} className="rounded-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-heading font-semibold tracking-widest uppercase">Vitaluxe</p>
            <p className="text-[10px] text-muted-foreground">Gestion interne</p>
          </div>
        </Link>

        <SidebarNav role={session.role} />

        <div className="p-3 border-t border-white/8">
          <UserMenu user={session} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
