import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galerie Photos - Hotel SETIFANA Conakry',
  description:
    "Explorez l'Hotel SETIFANA en images : chambres, suites, piscine, restaurant, spa et espaces communs. Hotel de luxe a Conakry, Guinee.",
  openGraph: {
    title: 'Galerie Photos - Hotel SETIFANA',
    description: "Decouvrez nos chambres, piscine, restaurant et espaces en images.",
    images: ['/images/hotel/hero-main.jpg'],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
