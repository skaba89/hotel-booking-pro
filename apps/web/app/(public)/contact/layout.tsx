import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contactez-nous - Hotel SETIFANA Conakry',
  description:
    "Contactez l'Hotel SETIFANA a Conakry par telephone, email ou WhatsApp. Notre equipe est disponible 24h/24 pour repondre a vos questions.",
  openGraph: {
    title: 'Contactez-nous - Hotel SETIFANA',
    description: "Besoin d'informations ? Contactez notre equipe par telephone, email ou WhatsApp.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
