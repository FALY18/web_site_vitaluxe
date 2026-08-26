import type { Metadata, Viewport } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' })

const siteUrl = 'https://vitaluxe.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'VITALUXE Distribution | Vitrage & Miroiterie à Madagascar',
    template: '%s | VITALUXE Distribution',
  },
  description:
    'Distributeur professionnel de vitrage, miroiterie, profilés aluminium et portes à Talatamaty, Antananarivo. Prix gros, stock permanent, livraison sur demande.',
  keywords: [
    'vitrage Madagascar',
    'miroiterie Antananarivo',
    'profilés aluminium Madagascar',
    'porte vitrée Madagascar',
    'distribution en gros Talatamaty',
    'verre sécurité Madagascar',
    'baie coulissante Madagascar',
    'VITALUXE',
  ],
  authors: [{ name: 'VITALUXE Distribution' }],
  creator: 'VITALUXE Distribution',
  publisher: 'VITALUXE Distribution',
  category: 'Matériaux de construction',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/logo.jpeg', type: 'image/jpeg' },
    ],
    apple: '/logo.jpeg',
    shortcut: '/logo.jpeg',
  },
  openGraph: {
    title: 'VITALUXE Distribution | Vitrage & Miroiterie à Madagascar',
    description:
      'Distributeur professionnel de vitrage, miroiterie et profilés aluminium à Talatamaty, Antananarivo. Stock permanent, prix professionnels.',
    url: siteUrl,
    siteName: 'VITALUXE Distribution',
    locale: 'fr_MG',
    type: 'website',
    images: [
      {
        url: '/logo.jpeg',
        width: 800,
        height: 800,
        alt: 'VITALUXE Distribution — Vitrage & Miroiterie Madagascar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VITALUXE Distribution | Vitrage & Miroiterie à Madagascar',
    description: 'Stock permanent de vitrage, miroiterie et profilés aluminium à Talatamaty.',
    images: ['/logo.jpeg'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#c8a96e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'VITALUXE Distribution',
              description: 'Distributeur professionnel de vitrage, miroiterie et profilés aluminium.',
              url: siteUrl,
              logo: `${siteUrl}/logo.jpeg`,
              image: `${siteUrl}/logo.jpeg`,
              telephone: '+261389657777',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Talatamaty, Commune Amborimpotsy',
                addressLocality: 'Antananarivo',
                addressCountry: 'MG',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -18.8667,
                longitude: 47.4667,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '08:00',
                closes: '17:00',
              },
              sameAs: ['https://wa.me/261343945996'],
            }),
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
