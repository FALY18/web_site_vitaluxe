import type { Metadata, Viewport } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'VITALUXE Distribution | Matériaux professionnels à Madagascar',
  description: 'Vitrage, miroiterie, profilés et accessoires en gros à Talatamaty. Demandez votre devis VITALUXE Distribution.',
  keywords: ['vitrage Madagascar', 'miroiterie Antananarivo', 'distribution en gros', 'Talatamaty'],
  openGraph: { title: 'VITALUXE Distribution', description: 'Des matières qui définissent vos espaces.', type: 'website', locale: 'fr_MG' },
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#eef0ef', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" className="bg-background"><body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>{children}</body></html>
}
