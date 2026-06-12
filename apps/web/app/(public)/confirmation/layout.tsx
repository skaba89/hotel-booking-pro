import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirmation de reservation - Hotel SETIFANA',
  description: "Votre reservation a l'Hotel SETIFANA Conakry est confirmee. Retrouvez tous les details de votre sejour.",
  robots: { index: false, follow: false },
};

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
