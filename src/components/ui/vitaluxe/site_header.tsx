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

export function SiteHeader({ itemCount, menuOpen, onMenuToggle, onBagOpen }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="#accueil">
        <BrandMark />
        <span>
          VITALUXE <small>DISTRIBUTION</small>
        </span>
      </a>

      <nav
        className={`main-nav ${menuOpen ? 'is-open' : ''}`}
        aria-label="Navigation principale"
      >
        <a href="#univers">Nos univers</a>
        <a href="#catalogue">Catalogue</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="header-actions">
        <a className="phone-link" href={contactConfig.phoneUrl}>
          {contactConfig.phoneDisplay}
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
        <Button
          variant="ghost"
          size="icon"
          className="menu-button"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={onMenuToggle}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>
    </header>
  )
}
