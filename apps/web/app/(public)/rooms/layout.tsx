import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Chambres - Hotel SETIFANA Conakry',
  description:
    "Decouvrez nos chambres et suites de luxe a Conakry. Standard, Superieure, Suite Junior, Suite Presidentielle, Familiale et Business. Reservez en ligne.",
  openGraph: {
    title: 'Nos Chambres - Hotel SETIFANA',
    description: "Chambres elegantes et suites luxueuses au coeur de Conakry. WiFi, climatisation, room service 24h.",
    images: ['/images/rooms/chambre-superieure-1.jpg'],
  },
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Chambres - Hotel SETIFANA',
            description: 'Nos chambres et suites de luxe a Conakry',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Chambre Standard' },
              { '@type': 'ListItem', position: 2, name: 'Chambre Superieure' },
              { '@type': 'ListItem', position: 3, name: 'Suite Junior' },
              { '@type': 'ListItem', position: 4, name: 'Suite Presidentielle' },
              { '@type': 'ListItem', position: 5, name: 'Chambre Familiale' },
              { '@type': 'ListItem', position: 6, name: 'Chambre Business' },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
