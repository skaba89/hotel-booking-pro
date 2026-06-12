'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Users, BedDouble, Award } from 'lucide-react';

function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString('fr-FR')}</span>;
}

const stats = [
  { icon: Users, value: 5000, suffix: '+', label: 'Clients satisfaits' },
  { icon: BedDouble, value: 25, suffix: '', label: 'Chambres de luxe' },
  { icon: Star, value: 4.8, suffix: '/5', label: 'Note moyenne' },
  { icon: Award, value: 10, suffix: ' ans', label: 'D\'experience' },
];

export function StatsCounter() {
  return (
    <section className="py-12 bg-[#071B33] relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071B33] via-[#0a2540] to-[#071B33]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C8A45D]/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-[#C8A45D]" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value % 1 !== 0 ? (
                  <span>{stat.value}</span>
                ) : (
                  <AnimatedNumber target={stat.value} />
                )}
                <span className="text-[#C8A45D]">{stat.suffix}</span>
              </div>
              <p className="text-white/60 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
