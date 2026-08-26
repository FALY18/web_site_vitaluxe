'use client'

import { useState } from 'react'
import { ArrowUpRight, Check, ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { mockExpertise, mockProducts } from '@/lib/mocks/vitaluxe'
import { contactConfig, waQuoteUrl } from '@/lib/config/contact'
import type { Product } from '@/lib/type_catalog'
import { ProductCatalog } from './ui/vitaluxe/product_catalog'
import { SiteHeader } from './ui/vitaluxe/site_header'
import { BrandMark } from './ui/vitaluxe/brand_mark'
import { WindBanner } from './ui/vitaluxe/wind_banner'


function HeroSection() {
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <p className="eyebrow">Distribution fiable · Madagascar</p>
          <h1>
            Des matières qui <em>définissent</em> vos espaces.
          </h1>
          <p className="hero-text">
            Vitrage, miroiterie et profilés sélectionnés pour les projets qui exigent précision,
            caractère et durabilité.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#catalogue">
              Découvrir le catalogue <ArrowUpRight />
            </a>
            <a className="text-link" href={waQuoteUrl}>
              Parler à un conseiller <span>↗</span>
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-label">
            <span className="pulse" />
            Stock professionnel <strong>disponible</strong>
          </div>
          <div className="glass-panel glass-a" />
          <div className="glass-panel glass-b" />
          <div className="hero-logo">
            <img src="/logo.jpeg" alt="Logo VITALUXE Distribution" />
          </div>
          <div className="vertical-note">TALATAMATY · 18°52&apos; S / 47°28&apos; E</div>
        </div>
      </section>

      <WindBanner />
    </>
  )
}

function ExpertiseSection() {
  return (
    <section id="univers" className="univers section-wrap">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Notre expertise</p>
          <h2>
            Un catalogue pensé<br />
            <em>pour construire.</em>
          </h2>
        </div>
        <p>
          Du détail architectural au projet d&apos;envergure, nous vous accompagnons avec des
          matériaux fiables et une vraie connaissance du terrain.
        </p>
      </div>

      <div className="universe-grid">
        {mockExpertise.map(({ number, title, text }, index) => (
          <article
            key={title}
            className={`universe-card ${index === 0 ? 'large' : ''} ${index === 2 ? 'accent' : ''}`}
          >
            <div className="card-number">{number}</div>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
              <a href="#catalogue">
                Explorer <ArrowUpRight />
              </a>
            </div>
            {index < 2 && (
              <div className={`line-art ${index === 0 ? 'line-glass' : 'line-mirror'}`} />
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <div className="section-wrap">
        <div className="contact-inner">
          <div>
            <p className="eyebrow">Parlons de votre projet</p>
            <h2>
              Le bon matériau<br />
              <em>change tout.</em>
            </h2>
            <div className="contact-detail">
              <p>
                Notre équipe vous répond du lundi au samedi pour vos demandes de prix, conseils et
                disponibilités.
              </p>
              <a className="contact-number" href={contactConfig.phoneUrl}>
                {contactConfig.phoneDisplay} <ArrowUpRight />
              </a>
              <a className="whatsapp-link" href={contactConfig.whatsappUrl}>
                WhatsApp direct <span>{contactConfig.whatsappDisplay}</span>
              </a>
              <p className="address">
                {contactConfig.address}<br />
                {contactConfig.city}
              </p>
            </div>
          </div>

          <div className="map-card">
            <iframe
              src="https://maps.google.com/maps?q=Talatamaty,+Commune+Amborimpotsy,+Antananarivo,+Madagascar&output=embed&z=15"
              title="Localisation VITALUXE Distribution"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="map-overlay">
              <span>📍 Talatamaty · Antananarivo</span>
              <a
                href="https://maps.app.goo.gl/nv1GA7Z3jUavdxrUA"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir dans Maps <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SelectionDrawer({
  items,
  open,
  onClose,
}: {
  items: Product[]
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="bag-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Votre sélection"
      >
        <div className="drawer-head">
          <h2>Votre sélection</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X />
          </Button>
        </div>
        <Separator />

        {items.length === 0 ? (
          <div className="empty-bag">
            <ShoppingBag />
            <p>Votre sélection est vide.</p>
            <a href="#catalogue" onClick={onClose}>Voir le catalogue</a>
          </div>
        ) : (
          <>
            <div className="bag-items">
              {items.map((item) => (
                <div className="bag-item" key={item.id}>
                  <div className="mini-material" />
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.unit}</small>
                  </div>
                  <Check />
                </div>
              ))}
            </div>
            <a className="drawer-cta" href={waQuoteUrl}>
              Demander le devis <ArrowUpRight />
            </a>
          </>
        )}
      </aside>
    </div>
  )
}

export function VitaluxeHome() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bagOpen, setBagOpen] = useState(false)
  const [bag, setBag] = useState<Product[]>([])

  const addProduct = (product: Product) => {
    setBag((current) =>
      current.some((item) => item.id === product.id) ? current : [...current, product]
    )
    setBagOpen(true)
  }

  return (
    <>
      <SiteHeader
        itemCount={bag.length}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onBagOpen={() => setBagOpen(true)}
      />
      <main id="accueil">
        <HeroSection />
        <ExpertiseSection />
        <ProductCatalog products={mockProducts} onAdd={addProduct} />
        <ContactSection />
      </main>
      <footer className="site-footer">
        <div className="brand">
          <BrandMark />
          <span>VITALUXE <small>DISTRIBUTION EN GROS</small></span>
        </div>
        <p>© 2026 VITALUXE Distribution. Tous droits réservés.</p>
        <a href="#accueil">Retour en haut ↑</a>
      </footer>
      <SelectionDrawer items={bag} open={bagOpen} onClose={() => setBagOpen(false)} />
    </>
  )
}
