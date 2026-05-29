import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offres & Promotions - Hotel SETIFANA Conakry',
  description:
    "Profitez de nos offres speciales : sejour longue duree, early bird, week-end romantique, offre business et famille. Hotel SETIFANA Conakry.",
  openGraph: {
    title: 'Offres & Promotions - Hotel SETIFANA',
    description: "Offres exclusives et promotions pour votre sejour a l'Hotel SETIFANA.",
  },
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
