import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Services - Hotel SETIFANA Conakry',
  description:
    "Restaurant gastronomique, piscine, spa, salle de conference, transfert aeroport. Decouvrez tous les services de l'Hotel SETIFANA a Conakry.",
  openGraph: {
    title: 'Nos Services - Hotel SETIFANA',
    description: "Restaurant, piscine, spa, conference et plus encore a l'Hotel SETIFANA Conakry.",
    images: ['/images/services/restaurant.jpg'],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
