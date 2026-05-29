'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Waves, Presentation, Sparkles, Bus, Dumbbell, WashingMachine, Mountain, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getServices } from '@/lib/api';

const iconMap: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed className="w-10 h-10" />,
  Waves: <Waves className="w-10 h-10" />,
  Presentation: <Presentation className="w-10 h-10" />,
  Sparkles: <Sparkles className="w-10 h-10" />,
  Bus: <Bus className="w-10 h-10" />,
  Dumbbell: <Dumbbell className="w-10 h-10" />,
  WashingMachine: <WashingMachine className="w-10 h-10" />,
  Mountain: <Mountain className="w-10 h-10" />,
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServices().then(setServices).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hotel/hero-1.jpg)', backgroundSize: 'cover' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4].map((i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">Nos Services</h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg">
            Une gamme complète de services pour un séjour exceptionnel à Conakry.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex space-x-5 p-6 rounded-xl bg-white border">
                <div className="w-16 h-16 bg-gray-100 animate-pulse rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex space-x-5 p-6 rounded-xl bg-white border hover:shadow-lg hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all duration-300">
                  {iconMap[service.icon] || <Sparkles className="w-10 h-10" />}
                </div>
                <div>
                  <h3 className="font-semibold text-primary text-lg mb-2 group-hover:text-gold transition-colors">{service.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3">
            Envie d&apos;en savoir plus ?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Contactez-nous pour personnaliser votre séjour ou réservez directement en ligne.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking">
              <Button variant="gold" size="lg">
                Réserver maintenant
              </Button>
            </Link>
            <a href="https://wa.me/224666057620" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
