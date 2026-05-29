'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, Star, Gift, Percent, Coffee, Car, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const tiers = [
  {
    name: 'Silver',
    icon: Star,
    nights: '1-4',
    color: 'from-gray-300 to-gray-500',
    textColor: 'text-gray-700',
    benefits: [
      'WiFi premium gratuit',
      'Late check-out (13h)',
      'Boisson de bienvenue',
      '5% sur le restaurant',
    ],
  },
  {
    name: 'Gold',
    icon: Crown,
    nights: '5-14',
    color: 'from-[#C8A45D] to-[#A0833A]',
    textColor: 'text-[#C8A45D]',
    benefits: [
      'Tout Silver +',
      'Upgrade chambre gratuit*',
      'Late check-out (15h)',
      '10% sur le restaurant',
      'Acces piscine VIP',
      'Petit-dejeuner offert',
    ],
  },
  {
    name: 'Platinum',
    icon: Sparkles,
    nights: '15+',
    color: 'from-purple-500 to-purple-800',
    textColor: 'text-purple-600',
    benefits: [
      'Tout Gold +',
      'Suite upgrade garanti*',
      'Transfert aeroport gratuit',
      'Late check-out (17h)',
      '20% sur tous les services',
      'Acces Spa gratuit',
      'Diner de bienvenue offert',
      'Conciergerie dediee',
    ],
  },
];

const howItWorks = [
  { step: 1, title: 'Reservez', description: 'Chaque nuit passee vous rapporte des points', icon: '🏨' },
  { step: 2, title: 'Cumulez', description: '1 nuit = 100 points. Bonus week-end: x2', icon: '⭐' },
  { step: 3, title: 'Profitez', description: 'Echangez vos points contre des avantages exclusifs', icon: '🎁' },
];

export default function LoyaltyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#071B33] to-[#0a2545] py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#C8A45D] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Crown className="w-14 h-14 text-[#C8A45D] mx-auto mb-4" />
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">Programme Fidelite</h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Rejoignez notre programme de fidelite et beneficiez d&apos;avantages exclusifs a chaque sejour. Plus vous sejourniez, plus vous gagnez.
          </p>
          <Link href="/booking">
            <Button variant="gold" size="lg" className="mt-6">
              Commencer a cumuler <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl font-bold text-center mb-10">Comment ca marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {howItWorks.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="w-8 h-8 rounded-full bg-[#C8A45D] text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-center mb-3">Niveaux de fidelite</h2>
          <p className="text-center text-gray-500 mb-10 max-w-lg mx-auto">
            Montez en grade automatiquement en fonction du nombre de nuits reservees sur 12 mois.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier, idx) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className={`overflow-hidden h-full ${idx === 1 ? 'ring-2 ring-[#C8A45D] shadow-xl scale-[1.02]' : ''}`}>
                    <div className={`bg-gradient-to-br ${tier.color} p-6 text-center text-white`}>
                      <Icon className="w-10 h-10 mx-auto mb-2" />
                      <h3 className="text-xl font-bold">{tier.name}</h3>
                      <p className="text-sm text-white/80 mt-1">{tier.nights} nuits / an</p>
                    </div>
                    <CardContent className="p-5">
                      <ul className="space-y-2.5">
                        {tier.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2 text-sm">
                            <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.textColor}`} />
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 mt-6">* Selon disponibilite. Les avantages sont cumulatifs.</p>
        </div>
      </section>

      {/* Earning table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl font-bold text-center mb-10">Comment gagner des points ?</h2>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                    <th className="px-5 py-3 text-right font-medium">Points gagnes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-gray-50"><td className="px-5 py-3">1 nuit reservee</td><td className="px-5 py-3 text-right font-bold text-[#C8A45D]">100 pts</td></tr>
                  <tr className="hover:bg-gray-50"><td className="px-5 py-3">Week-end (ven-dim)</td><td className="px-5 py-3 text-right font-bold text-[#C8A45D]">200 pts / nuit</td></tr>
                  <tr className="hover:bg-gray-50"><td className="px-5 py-3">Suite reservee</td><td className="px-5 py-3 text-right font-bold text-[#C8A45D]">300 pts / nuit</td></tr>
                  <tr className="hover:bg-gray-50"><td className="px-5 py-3">Laisser un avis</td><td className="px-5 py-3 text-right font-bold text-[#C8A45D]">50 pts</td></tr>
                  <tr className="hover:bg-gray-50"><td className="px-5 py-3">Parrainage (ami reserve)</td><td className="px-5 py-3 text-right font-bold text-[#C8A45D]">500 pts</td></tr>
                  <tr className="hover:bg-gray-50"><td className="px-5 py-3">Anniversaire</td><td className="px-5 py-3 text-right font-bold text-[#C8A45D]">200 pts (cadeau)</td></tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#071B33] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Pret a commencer ?</h2>
          <p className="text-white/70 mb-6 max-w-lg mx-auto">
            L&apos;inscription est automatique des votre premiere reservation. Aucun formulaire, aucune carte.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking">
              <Button variant="gold" size="lg">Reserver maintenant</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white/10">En savoir plus</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
