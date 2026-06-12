import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suivi de Reservation - Hotel SETIFANA Conakry',
  description:
    "Suivez le statut de votre reservation a l'Hotel SETIFANA. Entrez votre reference pour consulter les details de votre sejour.",
  robots: { index: false, follow: false },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
