import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questions Frequentes (FAQ) - Hotel SETIFANA Conakry',
  description:
    "Retrouvez les reponses a vos questions sur la reservation, le paiement, les services, le check-in et la localisation de l'Hotel SETIFANA a Conakry.",
  openGraph: {
    title: 'FAQ - Hotel SETIFANA',
    description: "Toutes les reponses a vos questions sur l'Hotel SETIFANA Conakry.",
  },
};

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment reserver une chambre ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vous pouvez reserver directement sur notre site en selectionnant vos dates, votre chambre, et en remplissant vos informations. La confirmation est instantanee.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels modes de paiement acceptez-vous ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nous acceptons les cartes bancaires (Visa, Mastercard) via Stripe, PayPal, le Mobile Money (Orange Money, MTN Money), et le paiement a l\'hotel.',
      },
    },
    {
      '@type': 'Question',
      name: 'Proposez-vous un service de navette aeroport ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, nous proposons un service de navette depuis/vers l\'aeroport international de Conakry. Reservez au moins 24h a l\'avance.',
      },
    },
    {
      '@type': 'Question',
      name: 'A quelle heure est le check-in / check-out ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le check-in est a partir de 14h00 et le check-out avant 12h00. Un early check-in ou late check-out peut etre arrange sur demande.',
      },
    },
  ],
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  );
}
