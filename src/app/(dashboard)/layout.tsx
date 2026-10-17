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
      <aside aria-label="Espace de gestion" className="flex shrink-0 flex-col border-b border-foreground/8 bg-card lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 lg:py-4">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
          <div className="rounded-full p-0.5 ring-1 ring-[#c8a96e]/50">
            <Image src="/logo.jpeg" alt="VITALUXE" width={32} height={32} className="rounded-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-heading font-semibold tracking-widest uppercase">Vitaluxe</p>
            <p className="text-[10px] text-muted-foreground">Gestion interne</p>
          </div>
        </Link>
        <div className="min-w-0 max-w-[55%] lg:hidden"><UserMenu user={session} compact /></div>
        </div>

        <SidebarNav role={session.role} />

        <div className="hidden p-3 border-t border-foreground/8 lg:block">
          <UserMenu user={session} />
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
