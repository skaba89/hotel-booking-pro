import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Avis Clients - Hotel SETIFANA Conakry',
  description:
    "Lisez les avis de nos clients sur l'Hotel SETIFANA a Conakry. Partagez votre experience et decouvrez pourquoi nos clients nous recommandent.",
  openGraph: {
    title: 'Avis Clients - Hotel SETIFANA',
    description: "Ce que nos clients disent de l'Hotel SETIFANA Conakry.",
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
