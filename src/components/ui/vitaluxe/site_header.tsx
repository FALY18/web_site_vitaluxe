'use client'

import { Menu, ShoppingBag, X } from 'lucide-react'
import { contactConfig } from '@/lib/config/contact'
import { Button } from '@/components/ui/button'
import { BrandMark } from './brand_mark'

type SiteHeaderProps = {
  itemCount: number
  menuOpen: boolean
  onMenuToggle: () => void
  onBagOpen: () => void
}

const navLinks = [
  { href: '#univers', label: 'Nos univers' },
  { href: '#catalogue', label: 'Catalogue' },
  { href: '#contact', label: 'Contact' },
]

export function SiteHeader({ itemCount, menuOpen, onMenuToggle, onBagOpen }: SiteHeaderProps) {
  return (
    <>
      <header className="site-header">
        {/* Brand */}
        <a className="brand" href="#accueil">
          <BrandMark />
          <span>
            VITALUXE <small>DISTRIBUTION</small>
          </span>
        </a>

        {/* Nav desktop */}
        <nav className="main-nav" aria-label="Navigation principale">
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <a className="phone-link" href={contactConfig.phoneUrl}>
            {contactConfig.phoneDisplay}
          </a>
          <a href="/login" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="hidden md:inline-flex border-[#c8a96e]/40 text-[#c8a96e] hover:bg-[#c8a96e]/10 hover:border-[#c8a96e]">
              Connexion
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="bag-button"
            aria-label={`Panier, ${itemCount} article(s)`}
            onClick={onBagOpen}
          >
            <ShoppingBag />
            {itemCount > 0 && <span>{itemCount}</span>}
          </Button>
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={onMenuToggle}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[98] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMenuToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-[99]
          w-[72vw] max-w-[300px]
          flex flex-col
          bg-[#12100d] border-l border-[#c8a96e]/30
          shadow-[−20px_0_60px_rgba(0,0,0,0.7)]
          transition-transform duration-300 ease-in-out
          md:hidden
          ${menuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="Menu mobile"
      >
        {/* Header sidebar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <span className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c8a96e] font-semibold">
            Menu
          </span>
          <button
            onClick={onMenuToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Liens */}
        <nav className="flex flex-col px-6 py-4 gap-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={onMenuToggle}
              className="
                flex items-center gap-3 px-3 py-3.5
                text-[0.88rem] font-semibold tracking-[0.08em] uppercase
                text-white/60 rounded-xl
                hover:text-[#c8a96e] hover:bg-[#c8a96e]/10
                transition-all duration-200
                border border-transparent hover:border-[#c8a96e]/20
              "
            >
              <span className="w-1 h-1 rounded-full bg-[#c8a96e]/40 flex-shrink-0" />
              {label}
            </a>
          ))}
        </nav>

        {/* Contact rapide */}
        <div className="mt-auto px-6 py-6 border-t border-white/10">
          <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white/30 mb-3">
            Contact direct
          </p>
          <a
            href={contactConfig.phoneUrl}
            className="flex items-center gap-2 text-[0.88rem] font-semibold text-[#c8a96e] hover:opacity-80 transition-opacity"
          >
            {contactConfig.phoneDisplay}
          </a>
          <a
            href={contactConfig.whatsappUrl}
            className="mt-2 flex items-center gap-2 text-[0.78rem] text-white/40 hover:text-white/70 transition-colors"
          >
            WhatsApp · {contactConfig.whatsappDisplay}
          </a>
        </div>
      </aside>
    </>
  )
}
