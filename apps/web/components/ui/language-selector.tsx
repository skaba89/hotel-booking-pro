'use client';

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation, localeNames, localeFlags, Locale } from '@/lib/i18n/provider';

const locales: Locale[] = ['fr', 'en', 'de', 'ar'];

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium">{localeFlags[locale]} {locale.toUpperCase()}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border py-1 z-50">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${locale === l ? 'text-[#C8A45D] font-medium' : 'text-gray-700'}`}
              >
                <span className="flex items-center gap-2">
                  <span>{localeFlags[l]}</span>
                  <span>{localeNames[l]}</span>
                </span>
                {locale === l && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
