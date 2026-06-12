'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tag, Calendar, Clock, Star, Gift, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const offers = [
  {
    id: 1,
    title: 'Séjour Longue Durée',
    description: 'Réservez 7 nuits ou plus et bénéficiez de 20% de réduction sur le prix total de votre séjour.',
    discount: '-20%',
    conditions: 'Minimum 7 nuits consécutives',
    validUntil: '31 Décembre 2026',
    icon: Calendar,
    color: 'from-blue-500 to-blue-700',
    badge: 'Populaire',
  },
  {
    id: 2,
    title: 'Early Bird',
    description: 'Réservez 30 jours à l\'avance et obtenez 15% de réduction sur votre chambre.',
    discount: '-15%',
    conditions: 'Réservation minimum 30 jours avant l\'arrivée',
    validUntil: '31 Décembre 2026',
    icon: Clock,
    color: 'from-purple-500 to-purple-700',
    badge: 'Anticipation',
  },
  {
    id: 3,
    title: 'Week-end Romantique',
    description: 'Suite Junior + dîner aux chandelles + bouteille de champagne + petit-déjeuner au lit. Package complet pour 2 personnes.',
    discount: 'Package',
    conditions: 'Vendredi-Dimanche uniquement',
    validUntil: '31 Décembre 2026',
    icon: Star,
    color: 'from-rose-500 to-rose-700',
    badge: 'Couple',
  },
  {
    id: 4,
    title: 'Offre Business',
    description: 'Chambre Business + accès salle de conférence + WiFi premium + petit-déjeuner + late checkout 14h.',
    discount: '-10%',
    conditions: 'Du lundi au vendredi',
    validUntil: '31 Décembre 2026',
    icon: Tag,
    color: 'from-emerald-500 to-emerald-700',
    badge: 'Pro',
  },
  {
    id: 5,
    title: 'Famille en Or',
    description: 'Chambre Familiale + enfants de moins de 12 ans gratuits + accès piscine illimité + activités enfants.',
    discount: 'Enfants gratuits',
    conditions: 'Maximum 3 enfants de -12 ans par chambre',
    validUntil: '31 Août 2026',
    icon: Gift,
    color: 'from-amber-500 to-amber-700',
    badge: 'Famille',
  },
  {
    id: 6,
    title: 'Dernière Minute',
    description: 'Réservez dans les 48h avant votre arrivée et profitez de tarifs exceptionnels sur les chambres disponibles.',
    discount: 'Jusqu\'à -25%',
    conditions: 'Selon disponibilité, non annulable',
    validUntil: 'Permanent',
    icon: Percent,
    color: 'from-red-500 to-red-700',
    badge: 'Flash',
  },
];

export default function OffersPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <Tag className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Offres & Promotions</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Profitez de nos offres exclusives pour rendre votre séjour encore plus exceptionnel.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer, index) => {
            const Icon = offer.icon;
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden h-full hover:shadow-xl transition-shadow group">
                  {/* Gradient Header */}
                  <div className={`bg-gradient-to-br ${offer.color} p-6 relative overflow-hidden`}>
                    <div className="absolute top-2 right-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
                      {offer.badge}
                    </div>
                    <Icon className="w-10 h-10 text-white/80 mb-3" />
                    <h3 className="font-bold text-white text-xl">{offer.title}</h3>
                    <div className="mt-2 inline-block bg-white/20 text-white text-2xl font-bold px-3 py-1 rounded-lg backdrop-blur-sm">
                      {offer.discount}
                    </div>
                  </div>

                  <CardContent className="p-5 flex flex-col h-[calc(100%-180px)]">
                    <p className="text-muted-foreground text-sm mb-4 flex-1">
                      {offer.description}
                    </p>
                    <div className="space-y-2 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Valide jusqu&apos;au {offer.validUntil}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{offer.conditions}</span>
                      </div>
                    </div>
                    <Link href="/booking">
                      <Button variant="gold" size="sm" className="w-full">
                        Réserver avec cette offre
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 bg-secondary rounded-2xl p-8">
          <h3 className="font-serif text-2xl font-bold text-primary mb-3">Besoin d&apos;un devis sur mesure ?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Pour les groupes, événements ou séjours prolongés, contactez-nous pour une offre personnalisée.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button variant="gold" size="lg">Demander un devis</Button>
            </Link>
            <a href="https://wa.me/224666057620" target="_blank" rel="noopener">
              <Button variant="outline" size="lg">WhatsApp</Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
