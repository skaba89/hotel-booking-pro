'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Waves, Presentation, Sparkles, Bus, Dumbbell, Mountain, WashingMachine } from 'lucide-react';
import { getServices } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/provider';

const iconMap: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed className="w-8 h-8" />,
  Waves: <Waves className="w-8 h-8" />,
  Presentation: <Presentation className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Bus: <Bus className="w-8 h-8" />,
  Dumbbell: <Dumbbell className="w-8 h-8" />,
  Mountain: <Mountain className="w-8 h-8" />,
  WashingMachine: <WashingMachine className="w-8 h-8" />,
};

export function ServicesPreview() {
  const [services, setServices] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    getServices().then((data) => setServices(data.slice(0, 6))).catch(console.error);
  }, []);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-3">
            {t('services.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-8 rounded-xl bg-white border hover:shadow-lg hover:border-gold/30 transition-all duration-300 group"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all duration-300">
                {iconMap[service.icon] || <Sparkles className="w-8 h-8" />}
              </div>
              <h3 className="font-semibold text-primary mb-2">{service.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/services" className="text-gold hover:text-gold-dark font-medium inline-flex items-center gap-1 group">
            {t('general.viewAll')}
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
