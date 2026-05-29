import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transfert Aeroport Conakry - Hotel SETIFANA',
  description:
    "Service de navette aeroport et transferts prives a Conakry. Vehicules climatises, chauffeurs professionnels. Reservez votre transfert en ligne.",
  openGraph: {
    title: 'Transfert Aeroport - Hotel SETIFANA',
    description: "Navette aeroport et transferts prives a Conakry. Reservation en ligne.",
  },
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
