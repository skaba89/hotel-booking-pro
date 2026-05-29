import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reservation en ligne - Hotel SETIFANA Conakry',
  description:
    "Reservez votre chambre en ligne a l'Hotel SETIFANA Conakry. Confirmation instantanee, paiement securise par carte, PayPal ou Mobile Money.",
  openGraph: {
    title: 'Reserver - Hotel SETIFANA',
    description: "Reservez en ligne votre sejour a l'Hotel SETIFANA. Confirmation instantanee.",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
