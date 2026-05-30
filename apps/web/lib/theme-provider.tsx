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
export interface PaletteColors {
  primary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
}

export const COLOR_MAP: Record<string, PaletteColors> = {
  // ── Palettes originales ──────────────────────────────────────────
  luxe_classique: { primary: '213 69% 11%', accent: '39 50% 57%',  accentLight: '39 50% 67%',  accentDark: '39 50% 45%'  },
  ocean:          { primary: '200 70% 15%', accent: '187 70% 45%', accentLight: '187 70% 58%', accentDark: '187 70% 32%' },
  emerald:        { primary: '160 60% 12%', accent: '145 55% 45%', accentLight: '145 55% 58%', accentDark: '145 55% 32%' },
  rose:           { primary: '340 45% 15%', accent: '350 65% 55%', accentLight: '350 65% 68%', accentDark: '350 65% 42%' },
  midnight:       { primary: '240 35% 12%', accent: '265 55% 55%', accentLight: '265 55% 68%', accentDark: '265 55% 42%' },
  sunset:         { primary: '15 55% 15%',  accent: '25 85% 55%',  accentLight: '25 85% 68%',  accentDark: '25 85% 42%'  },
  // ── Nouvelles palettes ───────────────────────────────────────────
  champagne:      { primary: '24 35% 11%',  accent: '44 60% 65%',  accentLight: '44 60% 75%',  accentDark: '44 60% 52%'  },
  royal_blue:     { primary: '220 82% 18%', accent: '210 65% 55%', accentLight: '210 65% 68%', accentDark: '210 65% 42%' },
  sage:           { primary: '150 27% 13%', accent: '150 38% 47%', accentLight: '150 38% 60%', accentDark: '150 38% 34%' },
  burgundy:       { primary: '350 52% 10%', accent: '348 78% 44%', accentLight: '348 78% 57%', accentDark: '348 78% 31%' },
  azure:          { primary: '210 45% 18%', accent: '196 80% 48%', accentLight: '196 80% 61%', accentDark: '196 80% 35%' },
  desert:         { primary: '20 42% 14%',  accent: '36 70% 51%',  accentLight: '36 70% 64%',  accentDark: '36 70% 38%'  },
};

export function applyThemeColors(primary?: string, accent?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (primary && COLOR_MAP[primary]) {
    const c = COLOR_MAP[primary];
    root.style.setProperty('--primary', c.primary);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--ring', c.accent);
    root.style.setProperty('--accent-light', c.accentLight);
    root.style.setProperty('--accent-dark', c.accentDark);
    root.style.setProperty('--accent-foreground', c.primary);
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
