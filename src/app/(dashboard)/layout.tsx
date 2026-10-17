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
    <div className="dashboard-shell flex min-h-screen flex-col bg-background lg:flex-row">
      <a href="#main-content" className="skip-link">Aller au contenu</a>
      <aside aria-label="Espace de gestion" className="flex shrink-0 flex-col border-b border-white/8 bg-[#0d0d0d] lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-r lg:border-b-0">
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

        <div className="hidden p-3 border-t border-white/8 lg:block">
          <UserMenu user={session} />
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-white/8 px-4 py-3 lg:hidden">
          <UserMenu user={session} />
        </div>
        {children}
      </main>
    </div>
  )
}
