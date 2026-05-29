'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReviews } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/provider';

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    getReviews().then((data) => {
      setReviews(data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[current];

  return (
    <section className="py-20 bg-[#071B33] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-10 left-10 opacity-5">
        <Quote className="w-32 h-32 text-white" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-5">
        <Quote className="w-24 h-24 text-white rotate-180" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">{t('testimonials.title')}</h2>
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[#C8A45D] text-[#C8A45D]" />
            ))}
            <span className="text-white/60 text-sm ml-2">{reviews.length} {t('testimonials.verified')}</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Stars */}
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-white/20'}`} />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-white/90 text-lg md:text-xl leading-relaxed italic mb-6">
                &ldquo;{review.comment}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C8A45D] flex items-center justify-center text-white font-bold">
                  {review.customerName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">{review.customerName}</p>
                  <p className="text-white/50 text-xs">Client verifie</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {reviews.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrent((current - 1 + reviews.length) % reviews.length)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-[#C8A45D] w-6' : 'bg-white/30'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrent((current + 1) % reviews.length)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
