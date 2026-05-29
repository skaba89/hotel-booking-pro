import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comparer nos Chambres - Hotel SETIFANA Conakry',
  description:
    "Comparez les equipements, tarifs et caracteristiques de toutes nos chambres pour choisir celle qui vous convient. Hotel SETIFANA Conakry.",
  openGraph: {
    title: 'Comparer nos Chambres - Hotel SETIFANA',
    description: "Trouvez la chambre ideale en comparant nos differentes categories.",
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
