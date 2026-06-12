'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Gift, Check } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { useToast } from './toast';
import { useTranslation } from '@/lib/i18n/provider';

export function NewsletterSection() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Erreur');
      setSubscribed(true);
    } catch {
      toast('Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary via-primary to-primary/90 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="w-8 h-8 text-gold" />
            </div>

            <h2 className="font-serif text-3xl font-bold text-white mb-3">
              {t('newsletter.title')}
            </h2>
            <p className="text-white/70 mb-8">
              {t('newsletter.subtitle')}
            </p>

            {subscribed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 inline-flex items-center gap-3"
              >
                <Check className="w-6 h-6 text-green-400" />
                <span className="text-white font-medium">Merci ! Vérifiez votre email pour votre code promo.</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t('newsletter.placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white"
                    required
                  />
                </div>
                <Button variant="gold" size="lg" type="submit" disabled={loading}>
                  {loading ? '...' : t('newsletter.button')}
                </Button>
              </form>
            )}

            <p className="text-white/40 text-xs mt-4">
              En vous inscrivant, vous acceptez de recevoir nos communications. Désabonnement possible à tout moment.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
