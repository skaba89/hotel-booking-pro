import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paiement - Hotel SETIFANA Conakry',
  description: "Finalisez le paiement de votre reservation a l'Hotel SETIFANA. Paiement securise par carte bancaire, PayPal ou Mobile Money.",
  robots: { index: false, follow: false },
};

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
