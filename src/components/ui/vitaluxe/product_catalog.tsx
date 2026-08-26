'use client'

import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockCategories, mockProducts } from '@/lib/mocks/vitaluxe'

type Product = (typeof mockProducts)[number]
type ProductCatalogProps = { products: Product[]; onAdd: (product: Product) => void }

export function ProductCatalog({ products, onAdd }: ProductCatalogProps) {
  const [category, setCategory] = useState<(typeof mockCategories)[number]>('Tous')
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === 'Tous' || p.category === category) &&
          p.name.toLowerCase().includes(query.toLowerCase())
      ),
    [products, category, query]
  )

  return (
    <section id="catalogue" className="catalogue-section">
      <div className="section-wrap">
        <div className="catalog-head">
          <div>
            <p className="eyebrow">Sélection du moment</p>
            <h2>
              Le catalogue<br />
              <em>professionnel.</em>
            </h2>
          </div>
          <div className="catalog-tools">
            <div className="search-box">
              <Search />
              <input
                aria-label="Rechercher un produit"
                placeholder="Rechercher"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="filters" role="group" aria-label="Filtrer par catégorie">
              {mockCategories.map((item) => (
                <Button
                  key={item}
                  variant={category === item ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="product-grid">
          {filtered.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-visual">
                {product.badge && (
                  <div className="badge-wrap">
                    <Badge>{product.badge}</Badge>
                  </div>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-img"
                />
              </div>
              <div className="product-info">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.unit}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="add-button"
                  aria-label={`Ajouter ${product.name}`}
                  onClick={() => onAdd(product)}
                >
                  <Plus />
                </Button>
              </div>
              <div className="product-meta">
                <strong>{product.price}</strong>
                <small>{product.category}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
