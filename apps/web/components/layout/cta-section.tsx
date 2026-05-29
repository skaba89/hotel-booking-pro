'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/provider';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          {t('cta.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/booking">
            <Button variant="gold" size="xl">
              {t('cta.button')}
            </Button>
          </Link>
          <a href="https://wa.me/224666057620" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="xl">
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
