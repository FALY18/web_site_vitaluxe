import type { Product } from '@/lib/type_catalog'

export const mockCategories = ['Tous', 'Vitrage', 'Miroiterie', 'Profilés', 'Accessoires'] as const

export const mockProducts: Product[] = [
  {
    id: 'vitrine-ldp',
    name: 'Vitrine de sécurité LDP',
    category: 'Vitrage',
    price: 'À partir de 150 000 Ar',
    unit: 'par m²',
    badge: 'Best seller',
  },
  {
    id: 'miroir-stand',
    name: 'Miroir de salle de bain standard',
    category: 'Miroiterie',
    price: 'À partir de 55 000 Ar',
    unit: 'unité',
    badge: 'Stock',
  },
  {
    id: 'profil-alu',
    name: 'Profilé aluminium premium',
    category: 'Profilés',
    price: 'À partir de 32 000 Ar',
    unit: 'ml',
  },
  {
    id: 'joint-silicone',
    name: 'Joint silicone haute résistance',
    category: 'Accessoires',
    price: 'À partir de 9 000 Ar',
    unit: 'boîte',
  },
]

export const mockExpertise = [
  {
    number: '01',
    title: 'Approvisionnement pro',
    text: 'Des références choisies pour répondre aux demandes de vitrages, profilés et finitions de chantier.',
  },
  {
    number: '02',
    title: 'Conseil terrain',
    text: 'On vous aide à choisir les bonnes épaisseurs, finitions et solutions selon votre usage et votre budget.',
  },
  {
    number: '03',
    title: 'Livraison fiable',
    text: 'Un service orienté projet pour garder votre planning en sécurité et limiter les pertes de temps.',
  },
]
