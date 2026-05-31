'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Save, Lock, Eye, EyeOff, Palette, Settings, CreditCard, Bell,
  Upload, Check, Building2, ToggleLeft, Shield, Image as ImageIcon,
  Type, Sun, Moon, RefreshCw, Smartphone, Mail, MessageCircle,
  Wifi, WifiOff, SendHorizonal, Loader2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { applyThemeColors, useTheme } from '@/lib/theme-provider';

// ─── Color Palettes ──────────────────────────────────────────────
const PALETTES = [
  // Originales
  { id: 'luxe_classique', name: 'Luxe Classique',      primary: '#071B33', accent: '#C8A45D', desc: 'Bleu nuit & or' },
  { id: 'ocean',          name: 'Ocean',               primary: '#0C2D3F', accent: '#2BA5A5', desc: 'Bleu profond & turquoise' },
  { id: 'emerald',        name: 'Emeraude',            primary: '#0D2818', accent: '#3DAA6D', desc: 'Vert foret & emeraude' },
  { id: 'rose',           name: 'Rose Gold',           primary: '#2D1520', accent: '#D4638F', desc: 'Bordeaux & rose' },
  { id: 'midnight',       name: 'Midnight',            primary: '#1A1A2E', accent: '#7B5EA7', desc: 'Violet nuit & lavande' },
  { id: 'sunset',         name: 'Coucher de soleil',   primary: '#2C1810', accent: '#E8732A', desc: 'Brun chaud & orange' },
  // Nouvelles
  { id: 'champagne',      name: 'Champagne',           primary: '#241609', accent: '#D4B87A', desc: 'Brun chaud & champagne' },
  { id: 'royal_blue',     name: 'Bleu Royal',          primary: '#071E5E', accent: '#4A8FCC', desc: 'Marine & bleu roi' },
  { id: 'sage',           name: 'Sauge',               primary: '#162820', accent: '#48A878', desc: 'Vert sage & menthe' },
  { id: 'burgundy',       name: 'Bordeaux',            primary: '#2A0810', accent: '#C41840', desc: 'Bordeaux profond & rubis' },
  { id: 'azure',          name: 'Azure',               primary: '#1A2D44', accent: '#1DA3D8', desc: 'Marine & azur' },
  { id: 'desert',         name: 'Desert',              primary: '#351D0F', accent: '#D49030', desc: 'Sable chaud & miel' },
];

const FONTS = [
  { id: 'playfair', name: 'Playfair Display', sample: 'Aa Bb Cc', desc: 'Elegant, serif classique' },
  { id: 'cormorant', name: 'Cormorant Garamond', sample: 'Aa Bb Cc', desc: 'Raffine, haute couture' },
  { id: 'lora', name: 'Lora', sample: 'Aa Bb Cc', desc: 'Moderne, lisible' },
  { id: 'inter', name: 'Inter', sample: 'Aa Bb Cc', desc: 'Clean, sans-serif' },
  { id: 'raleway', name: 'Raleway', sample: 'Aa Bb Cc', desc: 'Minimaliste, chic' },
];

const HERO_STYLES = [
  { id: 'slider', name: 'Carousel', desc: 'Defilement automatique d\'images' },
  { id: 'video', name: 'Video', desc: 'Video de fond en boucle' },
  { id: 'static', name: 'Image fixe', desc: 'Une seule image hero' },
  { id: 'parallax', name: 'Parallaxe', desc: 'Effet de profondeur au scroll' },
];

// ─── Tabs ────────────────────────────────────────────────────────
const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'features', label: 'Fonctionnalites', icon: ToggleLeft },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Securite', icon: Shield },
];

// ─── Main Component ──────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { refreshSettings } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Services test state
  const [servicesStatus, setServicesStatus] = useState<any>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [testCloudinaryLoading, setTestCloudinaryLoading] = useState(false);
  const [testCloudinaryResult, setTestCloudinaryResult] = useState<any>(null);

  useEffect(() => {
    api.get<any[]>('/admin/settings').then((data) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => (map[s.key] = s.value));
      setValues(map);
      setInitialValues(map);
      if (map.theme_logo_url) setLogoPreview(map.theme_logo_url);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const toggle = (key: string) => set(key, values[key] === 'true' ? 'false' : 'true');
  const isOn = (key: string) => values[key] === 'true';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', values);
      setInitialValues({ ...values });
      toast('Parametres sauvegardes avec succes', 'success');
      // Appliquer les couleurs immédiatement et rafraîchir le contexte global
      if (values.theme_primary_color) {
        applyThemeColors(values.theme_primary_color);
      }
      await refreshSettings();
    } catch (err: any) {
      toast(err.message || 'Erreur de sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload echoue');
      const data = await res.json();
      setLogoPreview(data.url);
      set('theme_logo_url', data.url);
      toast('Logo mis a jour', 'success');
    } catch (err: any) {
      toast(err.message || 'Erreur upload logo', 'error');
    }
  };

  const loadServicesStatus = async () => {
    setServicesLoading(true);
    try {
      const data = await api.get<any>('/admin/settings/services-status');
      setServicesStatus(data);
    } catch (err: any) {
      toast(err.message || 'Erreur', 'error');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const result = await api.post<any>('/admin/settings/test-email', { to: testEmailTo || undefined });
      setTestEmailResult(result);
    } catch (err: any) {
      setTestEmailResult({ success: false, message: err.message || 'Erreur réseau' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTestCloudinary = async () => {
    setTestCloudinaryLoading(true);
    setTestCloudinaryResult(null);
    try {
      const result = await api.post<any>('/admin/settings/test-cloudinary', {});
      setTestCloudinaryResult(result);
    } catch (err: any) {
      setTestCloudinaryResult({ success: false, message: err.message || 'Erreur réseau' });
    } finally {
      setTestCloudinaryLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast('Mot de passe modifie avec succes', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err.message || 'Erreur', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Toggle Switch Component ──
  const Toggle = ({ k, label, desc }: { k: string; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      <button
        onClick={() => toggle(k)}
        className={`relative w-11 h-6 rounded-full transition-colors ${isOn(k) ? 'bg-[#C8A45D]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOn(k) ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  // ── Field Component ──
  const Field = ({ k, label, type = 'text', placeholder }: { k: string; label: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <Input
        type={type}
        value={values[k] || ''}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className="max-w-md"
      />
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
            <p className="text-sm text-gray-500">Configurez votre site, apparence et fonctionnalites</p>
          </div>
          <Button variant="gold" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sauvegarde...' : hasChanges ? 'Sauvegarder' : 'A jour'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#071B33] text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════ GENERAL ═══════════════════ */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Informations de l&apos;hotel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field k="hotel_name" label="Nom de l'hotel" placeholder="Hotel SETIFANA" />
                <Field k="hotel_email" label="Email" type="email" placeholder="contact@setifana.com" />
                <Field k="hotel_phone" label="Telephone" placeholder="+224 666 05 76 20" />
                <Field k="hotel_whatsapp" label="WhatsApp" placeholder="+224666057620" />
                <Field k="hotel_address" label="Adresse" placeholder="Baie de Sangarea, Conakry" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Tarification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Devise</label>
                  <select
                    value={values.hotel_currency || 'GNF'}
                    onChange={(e) => set('hotel_currency', e.target.value)}
                    className="h-10 rounded-md border border-input px-3 text-sm max-w-md w-full"
                  >
                    <option value="GNF">GNF - Franc guineen</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dollar americain</option>
                    <option value="XOF">XOF - Franc CFA</option>
                  </select>
                </div>
                <Field k="hotel_tax_rate" label="Taux de taxe (%)" type="number" placeholder="18" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Reservation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field k="check_in_time" label="Heure de check-in" type="time" />
                <Field k="check_out_time" label="Heure de check-out" type="time" />
                <Field k="cancellation_hours" label="Heures avant annulation gratuite" type="number" placeholder="48" />
                <Field k="min_booking_nights" label="Nombre de nuits minimum" type="number" placeholder="1" />
                <Field k="max_booking_nights" label="Nombre de nuits maximum" type="number" placeholder="30" />
                <Field k="advance_booking_days" label="Jours de reservation a l'avance (max)" type="number" placeholder="365" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ APPEARANCE ═══════════════════ */}
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            {/* Logo */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Logo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />Changer le logo
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP ou SVG. Max 5 Mo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Palette de couleurs</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { set('theme_primary_color', p.id); applyThemeColors(p.id); }}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        values.theme_primary_color === p.id
                          ? 'border-[#C8A45D] ring-2 ring-[#C8A45D]/20 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {values.theme_primary_color === p.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#C8A45D] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: p.primary }} />
                        <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: p.accent }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fonts */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> Typographie</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => set('theme_font', f.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        (values.theme_font || 'playfair') === f.id
                          ? 'border-[#C8A45D] ring-2 ring-[#C8A45D]/20 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                        {(values.theme_font || 'playfair') === f.id && (
                          <div className="w-5 h-5 bg-[#C8A45D] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{f.desc}</p>
                      <p className="text-lg text-gray-700">{f.sample}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hero Style */}
            <Card>
              <CardHeader><CardTitle className="text-base">Style du Hero (page d&apos;accueil)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {HERO_STYLES.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => set('theme_hero_style', h.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        (values.theme_hero_style || 'slider') === h.id
                          ? 'border-[#C8A45D] ring-2 ring-[#C8A45D]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500">{h.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ FEATURES ═══════════════════ */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Widgets & Interactions</CardTitle></CardHeader>
              <CardContent>
                <Toggle k="feature_whatsapp" label="Bouton WhatsApp flottant" desc="Affiche un bouton WhatsApp en bas a droite" />
                <Toggle k="feature_chatbot" label="Chatbot" desc="Assistant virtuel integre" />
                <Toggle k="feature_social_proof" label="Notifications sociales" desc="Affiche des reservations recentes en toast" />
                <Toggle k="feature_cookie_consent" label="Bandeau cookies" desc="Affiche le consentement cookies RGPD" />
                <Toggle k="feature_newsletter" label="Newsletter" desc="Popup et formulaire d'inscription newsletter" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Pages & Sections</CardTitle></CardHeader>
              <CardContent>
                <Toggle k="feature_reviews" label="Page Avis clients" desc="Permet aux clients de laisser et consulter des avis" />
                <Toggle k="feature_loyalty" label="Programme Fidelite" desc="Affiche la page du programme de fidelite" />
                <Toggle k="feature_transfers" label="Transfert Aeroport" desc="Formulaire de reservation de navette" />
                <Toggle k="feature_comparison" label="Comparateur de chambres" desc="Tableau comparatif des types de chambres" />
                <Toggle k="feature_gallery" label="Galerie photos" desc="Page galerie avec lightbox" />
                <Toggle k="feature_offers" label="Page Offres & Promotions" desc="Affiche les offres speciales" />
                <Toggle k="feature_faq" label="Page FAQ" desc="Questions frequentes" />
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader><CardTitle className="text-base text-red-700">Mode Maintenance</CardTitle></CardHeader>
              <CardContent>
                <Toggle k="maintenance_mode" label="Activer le mode maintenance" desc="Le site affichera une page de maintenance aux visiteurs" />
                <Field k="maintenance_message" label="Message de maintenance" placeholder="Notre site est en cours de mise a jour. Revenez bientot !" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ PAYMENTS ═══════════════════ */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Methodes de paiement</CardTitle></CardHeader>
              <CardContent>
                <Toggle k="stripe_enabled" label="Carte bancaire (Stripe)" desc="Visa, Mastercard via Stripe" />
                <Toggle k="paypal_enabled" label="PayPal" desc="Paiement via compte PayPal" />
                <Toggle k="mobile_money_enabled" label="Mobile Money" desc="Orange Money, MTN Money, Wave" />
                <Toggle k="pay_at_hotel_enabled" label="Paiement a l'hotel" desc="Le client paie a son arrivee" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Options de paiement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field k="deposit_percentage" label="Acompte requis (%)" type="number" placeholder="0" />
                <Field k="min_booking_amount" label="Montant minimum de reservation" type="number" placeholder="100000" />
                <Toggle k="auto_confirm_payment" label="Confirmation automatique" desc="Confirmer automatiquement les reservations payees en ligne" />
                <Toggle k="invoice_auto_send" label="Facture automatique" desc="Envoyer la facture par email apres paiement" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Devises acceptees</CardTitle></CardHeader>
              <CardContent>
                <Toggle k="currency_gnf" label="GNF - Franc guineen" desc="Devise principale" />
                <Toggle k="currency_eur" label="EUR - Euro" />
                <Toggle k="currency_usd" label="USD - Dollar americain" />
                <Toggle k="currency_xof" label="XOF - Franc CFA" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ NOTIFICATIONS ═══════════════════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">

            {/* ── Diagnostic services ── */}
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><Wifi className="w-4 h-4 text-blue-600" /> Diagnostic services (Resend &amp; Cloudinary)</span>
                  <Button variant="outline" size="sm" onClick={loadServicesStatus} disabled={servicesLoading} className="text-xs">
                    {servicesLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Vérifier l&apos;état
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicesStatus && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email status */}
                    <div className={`rounded-lg p-3 border ${servicesStatus.email?.enabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {servicesStatus.email?.enabled
                          ? <Check className="w-4 h-4 text-green-600" />
                          : <WifiOff className="w-4 h-4 text-red-500" />}
                        <span className="text-sm font-semibold">
                          Email {servicesStatus.email?.provider ? `(${servicesStatus.email.provider.toUpperCase()})` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{servicesStatus.email?.message}</p>
                    </div>
                    {/* Cloudinary status */}
                    <div className={`rounded-lg p-3 border ${servicesStatus.cloudinary.enabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {servicesStatus.cloudinary.enabled
                          ? <Check className="w-4 h-4 text-green-600" />
                          : <WifiOff className="w-4 h-4 text-red-500" />}
                        <span className="text-sm font-semibold">Cloudinary (Images)</span>
                      </div>
                      <p className="text-xs text-gray-600">{servicesStatus.cloudinary.message}</p>
                    </div>
                  </div>
                )}

                {/* Test email */}
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5"><SendHorizonal className="w-3.5 h-3.5" /> Envoyer un email de test</p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="votre@email.com (laisser vide = email admin)"
                      value={testEmailTo}
                      onChange={(e) => setTestEmailTo(e.target.value)}
                      className="text-sm h-9"
                    />
                    <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={testEmailLoading} className="shrink-0">
                      {testEmailLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Envoyer'}
                    </Button>
                  </div>
                  {testEmailResult && (
                    <div className={`text-xs rounded p-2 ${testEmailResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {testEmailResult.success ? '✅ ' : '❌ '}{testEmailResult.message}
                      {testEmailResult.from && <span className="block opacity-70 mt-0.5">Depuis : {testEmailResult.from}</span>}
                    </div>
                  )}
                </div>

                {/* Test Cloudinary */}
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Tester l&apos;upload Cloudinary</p>
                  <Button variant="outline" size="sm" onClick={handleTestCloudinary} disabled={testCloudinaryLoading}>
                    {testCloudinaryLoading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Test en cours...</> : 'Lancer le test'}
                  </Button>
                  {testCloudinaryResult && (
                    <div className={`text-xs rounded p-2 ${testCloudinaryResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {testCloudinaryResult.success ? '✅ ' : '❌ '}{testCloudinaryResult.message}
                      {testCloudinaryResult.fix && <span className="block opacity-80 mt-1">💡 {testCloudinaryResult.fix}</span>}
                      {testCloudinaryResult.testImageUrl && (
                        <a href={testCloudinaryResult.testImageUrl} target="_blank" rel="noreferrer" className="block mt-1 underline">Voir l&apos;image test →</a>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4" /> Email</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field k="notif_admin_email" label="Email admin pour les notifications" type="email" placeholder="admin@setifana.com" />
                <Toggle k="notif_new_booking" label="Nouvelle reservation" desc="Email a chaque nouvelle reservation" />
                <Toggle k="notif_booking_cancelled" label="Annulation" desc="Email quand un client annule" />
                <Toggle k="notif_payment_received" label="Paiement recu" desc="Email a chaque paiement confirme" />
                <Toggle k="notif_new_review" label="Nouvel avis" desc="Email quand un avis est soumis" />
                <Toggle k="notif_new_contact" label="Nouveau message contact" desc="Email pour chaque message du formulaire contact" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Smartphone className="w-4 h-4" /> SMS / WhatsApp</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Toggle k="notif_sms_enabled" label="Notifications SMS" desc="Envoyer des SMS de confirmation aux clients" />
                <Toggle k="notif_whatsapp_enabled" label="Notifications WhatsApp" desc="Envoyer des confirmations via WhatsApp Business" />
                <Field k="notif_whatsapp_number" label="Numero WhatsApp Business" placeholder="+224666057620" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Messages clients</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Toggle k="notif_client_confirmation" label="Confirmation de reservation" desc="Email de confirmation envoye au client" />
                <Toggle k="notif_client_reminder" label="Rappel avant sejour" desc="Rappel envoye 24h avant le check-in" />
                <Toggle k="notif_client_checkout" label="Remerciement apres sejour" desc="Email de remerciement apres le check-out" />
                <Field k="notif_reminder_hours" label="Heures avant le check-in pour le rappel" type="number" placeholder="24" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════ SECURITY ═══════════════════ */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Mot de passe actuel</label>
                  <div className="relative max-w-md">
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nouveau mot de passe</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 caracteres"
                    className="max-w-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Confirmer</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                    className="max-w-md"
                  />
                </div>
                <Button
                  variant="gold"
                  disabled={passwordLoading || !currentPassword || !newPassword || newPassword.length < 8}
                  onClick={handlePasswordChange}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sessions & Acces</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field k="session_timeout_minutes" label="Expiration de session (minutes)" type="number" placeholder="60" />
                <Toggle k="security_2fa_enabled" label="Authentification a deux facteurs (2FA)" desc="Exiger un code OTP pour les connexions admin" />
                <Toggle k="security_login_captcha" label="CAPTCHA sur la page de connexion" desc="Protection contre les tentatives de brute force" />
                <Field k="security_max_login_attempts" label="Tentatives de connexion max avant blocage" type="number" placeholder="5" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sauvegardes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Toggle k="backup_auto_enabled" label="Sauvegardes automatiques" desc="Sauvegarde quotidienne de la base de donnees" />
                <Field k="backup_retention_days" label="Conservation des sauvegardes (jours)" type="number" placeholder="30" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Floating save bar when changes detected */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white border-t shadow-lg px-6 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2" />
                Modifications non sauvegardees
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setValues({ ...initialValues }); }}>
                  Annuler
                </Button>
                <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
