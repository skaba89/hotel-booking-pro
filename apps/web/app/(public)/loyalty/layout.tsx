import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Programme Fidelite - Hotel SETIFANA Conakry',
  description:
    "Rejoignez le programme de fidelite Hotel SETIFANA. Cumulez des points a chaque sejour et profitez d'avantages exclusifs : upgrades, spa, transferts gratuits.",
  openGraph: {
    title: 'Programme Fidelite - Hotel SETIFANA',
    description: "Cumulez des points et debloquez des avantages exclusifs a chaque sejour.",
  },
};

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
