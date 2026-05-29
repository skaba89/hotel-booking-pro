'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star, Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/provider';
import { useState } from 'react';

export function HeroSection() {
  const { t } = useTranslation();
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/hero-hotel.jpg)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold/30 rounded-full"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [-20, 20, -20], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-1 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5 fill-gold text-gold" />
            ))}
          </div>

          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
            Hotel <span className="text-gold">SETIFANA</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-2 font-light">
            {t('hero.title')}
          </p>

          <p className="text-white/70 max-w-2xl mx-auto mb-8 text-base md:text-lg">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking">
              <Button variant="gold" size="xl">
                {t('hero.cta')}
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" size="xl" className="border-white/60 bg-transparent text-white hover:bg-white/15 hover:text-white">
                {t('rooms.details')}
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/60 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {t('booking.instant')}
            </span>
            <span>{t('booking.cancel')}</span>
            <span>{t('booking.bestprice')}</span>
            <span>{t('booking.secure')}</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
