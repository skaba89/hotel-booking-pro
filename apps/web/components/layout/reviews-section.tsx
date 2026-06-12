'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { getReviews } from '@/lib/api';

export function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    getReviews().then((data) => setReviews(data.slice(0, 4))).catch(console.error);
  }, []);

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
            Ce que disent nos clients
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            La satisfaction de nos clients est notre plus grande récompense.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6"
            >
              <Quote className="w-8 h-8 text-gold/50 mb-3" />
              <p className="text-white/80 text-sm mb-4 italic">
                &quot;{review.comment}&quot;
              </p>
              <div className="flex items-center justify-between">
                <span className="text-gold font-medium text-sm">{review.customerName}</span>
                <div className="flex">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
