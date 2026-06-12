'use client';

import { useState, createContext, useContext, ReactNode } from 'react';

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  convert: (amountGNF: number) => number;
  format: (amountGNF: number) => string;
  symbol: string;
}

const rates: Record<string, { rate: number; symbol: string; locale: string }> = {
  GNF: { rate: 1, symbol: 'GNF', locale: 'fr-GN' },
  EUR: { rate: 0.000104, symbol: '€', locale: 'fr-FR' },
  USD: { rate: 0.000115, symbol: '$', locale: 'en-US' },
  XOF: { rate: 0.0625, symbol: 'FCFA', locale: 'fr-SN' },
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'GNF',
  setCurrency: () => {},
  convert: (a) => a,
  format: (a) => `${a.toLocaleString()} GNF`,
  symbol: 'GNF',
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState('GNF');

  const convert = (amountGNF: number) => {
    return Math.round(amountGNF * rates[currency].rate * 100) / 100;
  };

  const format = (amountGNF: number) => {
    const converted = convert(amountGNF);
    if (currency === 'GNF') {
      return `${converted.toLocaleString('fr-GN')} GNF`;
    }
    if (currency === 'XOF') {
      return `${converted.toLocaleString('fr-SN')} FCFA`;
    }
    return new Intl.NumberFormat(rates[currency].locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, symbol: rates[currency].symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="text-sm bg-transparent border border-white/20 text-white rounded px-2 py-1 cursor-pointer"
    >
      <option value="GNF" className="text-black">🇬🇳 GNF</option>
      <option value="EUR" className="text-black">🇪🇺 EUR</option>
      <option value="USD" className="text-black">🇺🇸 USD</option>
      <option value="XOF" className="text-black">🇸🇳 FCFA</option>
    </select>
  );
}
