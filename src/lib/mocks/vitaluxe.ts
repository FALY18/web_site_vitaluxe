import { products } from '@/lib/mock/data'

export const mockCategories = ['Tous', 'Vitrage', 'Miroiterie', 'Portes', 'Profilés', 'Accessoires'] as const

export const mockProducts = products

export const mockExpertise = [
  {
    number: '01',
    title: 'Approvisionnement pro',
    text: 'Des références choisies pour répondre aux demandes de vitrages, profilés et finitions de chantier.',
  },
  {
    number: '02',
    title: 'Conseil terrain',
    text: "On vous aide à choisir les bonnes épaisseurs, finitions et solutions selon votre usage et votre budget.",
  },
  {
    number: '03',
    title: 'Livraison fiable',
    text: 'Un service orienté projet pour garder votre planning en sécurité et limiter les pertes de temps.',
  },
]
