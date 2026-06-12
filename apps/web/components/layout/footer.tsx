'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook, Twitter } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/provider';
import { useTheme } from '@/lib/theme-provider';

export function Footer() {
  const { t } = useTranslation();
  const { settings } = useTheme();
  const phone = settings.hotel_phone || '+224 666 05 76 20';
  const email = settings.hotel_email || 'contact@setifana.com';
  const address = settings.hotel_address || 'Baie de Sangarea, Conakry, Guinee';
  const whatsapp = settings.hotel_whatsapp || '224666057620';
  const hotelName = settings.hotel_name || 'SETIFANA';

  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <span className="text-primary font-serif font-bold text-lg">S</span>
              </div>
              <span className="font-serif text-2xl font-bold text-gold">{hotelName}</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {t('footer.description')}
            </p>
            {/* Social links */}
            <div className="flex items-center space-x-3">
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gold mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-2">
              <li><Link href="/rooms" className="text-white/70 hover:text-gold text-sm transition-colors">{t('nav.rooms')}</Link></li>
              <li><Link href="/services" className="text-white/70 hover:text-gold text-sm transition-colors">{t('nav.services')}</Link></li>
              <li><Link href="/offers" className="text-white/70 hover:text-gold text-sm transition-colors">{t('nav.offers')}</Link></li>
              <li><Link href="/gallery" className="text-white/70 hover:text-gold text-sm transition-colors">{t('nav.gallery')}</Link></li>
              <li><Link href="/loyalty" className="text-white/70 hover:text-gold text-sm transition-colors">Fidélité</Link></li>
              <li><Link href="/reviews" className="text-white/70 hover:text-gold text-sm transition-colors">Avis</Link></li>
              <li><Link href="/about" className="text-white/70 hover:text-gold text-sm transition-colors">À propos</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-gold text-sm transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-white/70 text-sm">
                <Phone className="w-4 h-4 mr-2 text-gold" />
                {phone}
              </li>
              <li className="flex items-center text-white/70 text-sm">
                <Mail className="w-4 h-4 mr-2 text-gold" />
                {email}
              </li>
              <li className="flex items-start text-white/70 text-sm">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gold" />
                {address}
              </li>
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-green-400 hover:text-green-300"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><Link href="/legal" className="text-white/70 hover:text-gold text-sm transition-colors">{t('footer.legalNotice')}</Link></li>
              <li><Link href="/legal" className="text-white/70 hover:text-gold text-sm transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link href="/legal" className="text-white/70 hover:text-gold text-sm transition-colors">{t('footer.terms')}</Link></li>
              <li><Link href="/legal" className="text-white/70 hover:text-gold text-sm transition-colors">{t('footer.cancellation')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Hotel {hotelName}. {t('footer.rights')}.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-white/50 text-xs">{t('footer.securePayments')}</span>
            <div className="flex space-x-2">
              <div className="bg-white/10 rounded px-2 py-1 text-xs">Visa</div>
              <div className="bg-white/10 rounded px-2 py-1 text-xs">MC</div>
              <div className="bg-white/10 rounded px-2 py-1 text-xs">PayPal</div>
              <div className="bg-white/10 rounded px-2 py-1 text-xs">MTN</div>
              <div className="bg-white/10 rounded px-2 py-1 text-xs">Orange</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
