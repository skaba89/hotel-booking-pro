import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales, politique de confidentialité et conditions de réservation de l\'Hotel SETIFANA.',
};

export default function LegalPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-white">Informations légales</h1>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-3xl space-y-12">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">Mentions légales</h2>
          <div className="prose prose-sm text-muted-foreground">
            <p><strong>Raison sociale :</strong> Hotel SETIFANA</p>
            <p><strong>Adresse :</strong> H8XV+659 Baie de Sangaréa, Conakry, Guinée</p>
            <p><strong>Téléphone :</strong> +224 666 05 76 20</p>
            <p><strong>Email :</strong> contact@setifana.com</p>
            <p>L&apos;Hotel SETIFANA est un établissement hôtelier enregistré en République de Guinée.</p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">Politique de confidentialité</h2>
          <div className="prose prose-sm text-muted-foreground space-y-3">
            <p>Nous collectons uniquement les données nécessaires à la gestion de votre réservation : nom, email, téléphone, dates de séjour.</p>
            <p>Vos données personnelles ne sont jamais vendues ou transmises à des tiers non autorisés. Elles sont utilisées exclusivement pour le traitement de votre réservation et la communication avec notre hôtel.</p>
            <p>Les données de paiement sont traitées de manière sécurisée par nos prestataires certifiés (Stripe, PayPal) et ne sont jamais stockées sur nos serveurs.</p>
            <p>Vous disposez d&apos;un droit d&apos;accès, de modification et de suppression de vos données en contactant notre service client.</p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">Conditions de réservation</h2>
          <div className="prose prose-sm text-muted-foreground space-y-3">
            <p><strong>Check-in :</strong> à partir de 14h00</p>
            <p><strong>Check-out :</strong> avant 12h00</p>
            <p>Toute réservation est confirmée après réception du paiement ou validation par notre équipe pour les paiements à l&apos;hôtel.</p>
            <p>Les tarifs affichés incluent les taxes applicables sauf mention contraire.</p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">Politique d&apos;annulation</h2>
          <div className="prose prose-sm text-muted-foreground space-y-3">
            <p>Annulation gratuite jusqu&apos;à 48 heures avant la date d&apos;arrivée.</p>
            <p>Annulation moins de 48 heures avant l&apos;arrivée : facturation de la première nuit.</p>
            <p>Non-présentation (no-show) : facturation de la totalité du séjour.</p>
            <p>Les remboursements sont effectués sous 5 à 10 jours ouvrables selon le mode de paiement utilisé.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
