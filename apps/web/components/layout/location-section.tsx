'use client';

import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Clock, Car, Plane, Palmtree, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/provider';

export function LocationSection() {
  const { t } = useTranslation();

  const nearbyPlaces = [
    { icon: Plane, name: 'Aeroport International AST', distance: '25 min', detail: 'Navette disponible' },
    { icon: Car, name: 'Centre-ville Conakry', distance: '20 min', detail: 'Acces direct' },
    { icon: Palmtree, name: 'Baie de Sangarea', distance: 'Sur place', detail: 'Vue sur la baie' },
    { icon: ShoppingBag, name: 'Marche de Madina', distance: '30 min', detail: 'Shopping & artisanat' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#071B33] mb-3">
              {t('location.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('location.subtitle')}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-lg border border-gray-100"
          >
            <div className="relative h-[400px] bg-gray-100">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.5!2d-13.5786!3d9.6411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xf1cd0326f73f3e1%3A0x0!2zSG90ZWwgU0VUSUZBTkE!5e0!3m2!1sfr!2sgn!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Address Card */}
            <div className="bg-[#071B33] rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C8A45D]/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[#C8A45D]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Hotel SETIFANA</h3>
                  <p className="text-white/70 text-sm">H8XV+659 Baie de Sangarea</p>
                  <p className="text-white/70 text-sm">Conakry, Guinee</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C8A45D]" />
                  <a href="tel:+224666057620" className="text-sm text-white/80 hover:text-[#C8A45D] transition-colors">
                    +224 666 05 76 20
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C8A45D]" />
                  <span className="text-sm text-white/80">24h/24, 7j/7</span>
                </div>
              </div>
            </div>

            {/* Nearby Places */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                {t('location.nearby')}
              </h4>
              {nearbyPlaces.map((place, index) => (
                <motion.div
                  key={place.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#C8A45D]/10 flex items-center justify-center flex-shrink-0">
                    <place.icon className="w-5 h-5 text-[#C8A45D]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.detail}</p>
                  </div>
                  <span className="text-sm font-bold text-[#071B33] bg-gray-200 px-3 py-1 rounded-full">
                    {place.distance}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="https://www.google.com/maps/dir//H8XV%2B659+Baie+de+Sangar%C3%A9a,+Conakry,+Guinea"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#C8A45D] text-white rounded-xl font-medium hover:bg-[#B8944D] transition-colors"
            >
              <Navigation className="w-4 h-4" />
              {t('location.directions')}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
