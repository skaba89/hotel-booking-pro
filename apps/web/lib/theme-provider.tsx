'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface SiteSettings {
  // Hotel info
  hotel_name?: string;
  hotel_email?: string;
  hotel_phone?: string;
  hotel_whatsapp?: string;
  hotel_address?: string;
  hotel_currency?: string;
  hotel_tax_rate?: string;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_hours?: string;
  // Payments
  stripe_enabled?: string;
  paypal_enabled?: string;
  mobile_money_enabled?: string;
  pay_at_hotel_enabled?: string;
  // Theme
  theme_primary_color?: string;
  theme_accent_color?: string;
  theme_font?: string;
  theme_logo_url?: string;
  theme_hero_style?: string;
  // Features
  feature_whatsapp?: string;
  feature_chatbot?: string;
  feature_social_proof?: string;
  feature_newsletter?: string;
  feature_reviews?: string;
  feature_loyalty?: string;
  feature_transfers?: string;
  feature_comparison?: string;
  feature_cookie_consent?: string;
  maintenance_mode?: string;
}

interface ThemeContextType {
  settings: SiteSettings;
  isFeatureEnabled: (key: string) => boolean;
  refreshSettings: () => Promise<void>;
  loaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: {},
  isFeatureEnabled: () => true,
  refreshSettings: async () => {},
  loaded: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// Color name → HSL for CSS variable injection
const COLOR_MAP: Record<string, { primary: string; accent: string }> = {
  luxe_classique: { primary: '213 69% 11%', accent: '39 50% 57%' },
  ocean: { primary: '200 70% 15%', accent: '187 70% 45%' },
  emerald: { primary: '160 60% 12%', accent: '145 55% 45%' },
  rose: { primary: '340 45% 15%', accent: '350 65% 55%' },
  midnight: { primary: '240 35% 12%', accent: '265 55% 55%' },
  sunset: { primary: '15 55% 15%', accent: '25 85% 55%' },
};

function applyThemeColors(primary?: string, accent?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (primary && COLOR_MAP[primary]) {
    root.style.setProperty('--primary', COLOR_MAP[primary].primary);
    root.style.setProperty('--accent', COLOR_MAP[primary].accent);
    root.style.setProperty('--ring', COLOR_MAP[primary].accent);
  } else {
    // Custom color values — expect HSL strings like "213 69% 11%"
    if (primary) root.style.setProperty('--primary', primary);
    if (accent) {
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--ring', accent);
    }
  }
}

function applyFont(font?: string) {
  if (typeof document === 'undefined' || !font) return;
  const root = document.documentElement;

  const fontMap: Record<string, string> = {
    playfair: "'Playfair Display', Georgia, serif",
    cormorant: "'Cormorant Garamond', Georgia, serif",
    lora: "'Lora', Georgia, serif",
    inter: "'Inter', system-ui, sans-serif",
    raleway: "'Raleway', system-ui, sans-serif",
  };

  if (fontMap[font]) {
    root.style.setProperty('--font-serif', fontMap[font]);
  }
}

const API_BASE = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005')
  : '';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loaded, setLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/public`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);

        // Apply theme
        applyThemeColors(data.theme_primary_color, data.theme_accent_color);
        applyFont(data.theme_font);
      }
    } catch {
      // API not available — use defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isFeatureEnabled = useCallback(
    (key: string) => {
      const val = settings[key as keyof SiteSettings];
      if (val === undefined) return true; // default: enabled
      return val === 'true';
    },
    [settings],
  );

  return (
    <ThemeContext.Provider value={{ settings, isFeatureEnabled, refreshSettings: fetchSettings, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}
