import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import { I18nProvider } from '@/lib/i18n/provider';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/lib/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://setifana.com'),
  title: {
    default: 'Hotel SETIFANA - Hôtel de luxe à Conakry, Guinée',
    template: '%s | Hotel SETIFANA',
  },
  description: "Découvrez l'excellence hôtelière à Conakry. Hotel SETIFANA vous offre des chambres luxueuses, un restaurant gastronomique et des services premium. Réservez en ligne.",
  keywords: ['hôtel', 'Conakry', 'Guinée', 'luxe', 'réservation', 'SETIFANA', 'hébergement'],
  openGraph: {
    title: 'Hotel SETIFANA - Hôtel de luxe à Conakry',
    description: "L'excellence de l'hospitalité guinéenne. Chambres luxueuses, restaurant, piscine, salle de conférence.",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Hotel SETIFANA',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#071B33" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Hotel',
              name: 'Hotel SETIFANA',
              description: "Hôtel de luxe à Conakry offrant des chambres premium, restaurant gastronomique et services haut de gamme.",
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'H8XV+659 Baie de Sangaréa',
                addressLocality: 'Conakry',
                addressCountry: 'GN',
              },
              telephone: '+224666057620',
              starRating: { '@type': 'Rating', ratingValue: '4' },
              priceRange: '$$$$',
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <I18nProvider><ToastProvider><ThemeProvider>{children}</ThemeProvider></ToastProvider></I18nProvider>
      </body>
    </html>
  );
}
