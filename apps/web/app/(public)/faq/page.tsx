'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Réservation',
    questions: [
      {
        q: 'Comment réserver une chambre ?',
        a: "Vous pouvez réserver directement sur notre site en sélectionnant vos dates, votre chambre, et en remplissant vos informations. La confirmation est instantanée. Vous pouvez aussi nous contacter par WhatsApp pour une assistance personnalisée.",
      },
      {
        q: 'Puis-je annuler ma réservation gratuitement ?',
        a: "Oui, l'annulation est gratuite jusqu'à 48 heures avant la date d'arrivée. Au-delà, des frais équivalents à la première nuit peuvent s'appliquer.",
      },
      {
        q: 'Comment modifier ma réservation ?',
        a: "Contactez-nous par WhatsApp ou email avec votre numéro de réservation. Nous ferons notre possible pour accommoder vos changements selon les disponibilités.",
      },
      {
        q: "À quelle heure est le check-in / check-out ?",
        a: "Le check-in est à partir de 14h00 et le check-out avant 12h00. Un early check-in ou late check-out peut être arrangé sur demande (sous réserve de disponibilité), moyennant un supplément.",
      },
    ],
  },
  {
    category: 'Paiement',
    questions: [
      {
        q: 'Quels modes de paiement acceptez-vous ?',
        a: "Nous acceptons les cartes bancaires (Visa, Mastercard) via Stripe, PayPal, le Mobile Money (Orange Money, MTN Money), et le paiement à l'hôtel à l'arrivée.",
      },
      {
        q: "Le paiement en ligne est-il sécurisé ?",
        a: "Absolument. Tous les paiements sont traités via des plateformes certifiées (Stripe, PayPal) avec chiffrement SSL 256 bits. Nous ne stockons jamais vos données bancaires.",
      },
      {
        q: 'Puis-je payer en euros ou en dollars ?',
        a: "Oui, notre système accepte les paiements en GNF, EUR, USD et FCFA. La conversion se fait au taux du jour.",
      },
    ],
  },
  {
    category: 'Services',
    questions: [
      {
        q: "Proposez-vous un service de navette aéroport ?",
        a: "Oui, nous proposons un service de navette depuis/vers l'aéroport international de Conakry. Réservez au moins 24h à l'avance via WhatsApp ou lors de votre réservation.",
      },
      {
        q: 'Le petit-déjeuner est-il inclus ?',
        a: "Le petit-déjeuner est inclus pour les Suites et les chambres Supérieures. Pour les chambres Standard, il peut être ajouté moyennant un supplément de 150 000 GNF par personne.",
      },
      {
        q: "Avez-vous une piscine ?",
        a: "Oui, nous disposons d'une grande piscine extérieure accessible à tous nos clients de 7h à 21h. Des serviettes sont fournies gratuitement au bord de la piscine.",
      },
      {
        q: "Le WiFi est-il gratuit ?",
        a: "Oui, le WiFi haut débit est gratuit dans tout l'hôtel : chambres, espaces communs, restaurant et bord de piscine.",
      },
      {
        q: "Acceptez-vous les animaux de compagnie ?",
        a: "Malheureusement, les animaux de compagnie ne sont pas acceptés dans l'hôtel, à l'exception des chiens d'assistance.",
      },
    ],
  },
  {
    category: 'Localisation',
    questions: [
      {
        q: "Où se situe l'hôtel exactement ?",
        a: "L'Hôtel SETIFANA est situé dans le quartier de Ratoma à Conakry, Guinée. Nous sommes à 25 minutes de l'aéroport et à proximité des principaux centres d'affaires.",
      },
      {
        q: "Y a-t-il un parking ?",
        a: "Oui, nous disposons d'un parking privé gratuit et sécurisé pour nos clients, accessible 24h/24.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-4 text-left hover:text-gold transition-colors"
      >
        <span className="font-medium text-sm md:text-base pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-muted-foreground text-sm pb-4 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <HelpCircle className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Questions Fréquentes</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Retrouvez les réponses aux questions les plus courantes sur notre hôtel et nos services.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-4xl">
        {faqs.map((section) => (
          <div key={section.category} className="mb-8">
            <h2 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gold rounded-full" />
              {section.category}
            </h2>
            <div className="bg-white rounded-xl border shadow-sm px-6">
              {section.questions.map((faq) => (
                <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-8 text-center mt-12">
          <h3 className="font-serif text-2xl font-bold text-white mb-3">
            Vous n&apos;avez pas trouvé votre réponse ?
          </h3>
          <p className="text-white/70 mb-6">Notre équipe est disponible 24h/24 pour vous aider.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/224666057620"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
            <a
              href="tel:+224666057620"
              className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition"
            >
              <Phone className="w-5 h-5" />
              +224 666 05 76 20
            </a>
            <a
              href="mailto:contact@setifana.com"
              className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
