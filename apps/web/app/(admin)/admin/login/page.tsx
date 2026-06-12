'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, Loader2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { adminLogin, saveAuthToken, loadAuthToken } from '@/lib/api';

// Maximum number of automatic retries on 502 / network errors (cold start)
const MAX_RETRIES = 4;
// Seconds to wait between retries (doubles each time: 5, 10, 15, 20)
const RETRY_DELAY_SEC = 5;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  // Cold-start state
  const [warmingUp, setWarmingUp]     = useState(false);
  const [retryCount, setRetryCount]   = useState(0);
  const [countdown, setCountdown]     = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const credentialsRef = useRef<{ email: string; password: string } | null>(null);

  // ── Already authenticated? Skip to dashboard ────────────────────────────
  useEffect(() => {
    const token  = loadAuthToken();
    const raw    = localStorage.getItem('user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw);
        if (user.role === 'ADMIN' || user.role === 'STAFF') {
          const sp = new URLSearchParams(window.location.search);
          router.replace(sp.get('redirect') || '/admin/dashboard');
          return;
        }
      } catch { /* ignore */ }
    }
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('expired') === '1') {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
    }
  }, [router]);

  // ── Cleanup interval on unmount ──────────────────────────────────────────
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  // ── Core login logic (called on submit and on retry) ────────────────────
  const attemptLogin = async (emailVal: string, passwordVal: string, attempt = 0) => {
    setLoading(true);
    setError('');
    setWarmingUp(false);

    try {
      const data = await adminLogin(emailVal, passwordVal);

      if (data.user.role !== 'ADMIN' && data.user.role !== 'STAFF') {
        setError('Accès refusé. Ce compte n\'a pas les droits d\'administration.');
        setLoading(false);
        setWarmingUp(false);
        return;
      }

      saveAuthToken(data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      const sp = new URLSearchParams(window.location.search);
      router.replace(sp.get('redirect') || '/admin/dashboard');

    } catch (err: any) {
      const msg: string = err.message || '';

      // ── 502 / 503 / 504 = Render cold-start → auto-retry ─────────────
      // api.ts prefixes cold-start errors with COLD_START_ for reliable detection.
      // We also catch raw network failures ('Failed to fetch', 'NetworkError').
      const isColdStart =
        msg.includes('COLD_START_') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('gateway');

      if (isColdStart && attempt < MAX_RETRIES) {
        const nextAttempt = attempt + 1;
        const delaySec   = RETRY_DELAY_SEC * nextAttempt;       // 5, 10, 15, 20
        setRetryCount(nextAttempt);
        setWarmingUp(true);
        setLoading(false);
        setCountdown(delaySec);

        // Countdown timer
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              // Trigger next attempt
              attemptLogin(emailVal, passwordVal, nextAttempt);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        // Final failure or non-502 error
        setWarmingUp(false);
        setLoading(false);
        setRetryCount(0);
        if (isColdStart) {
          setError(
            'Le serveur met plus de temps que prévu à démarrer. ' +
            'Attendez 1–2 minutes puis rechargez la page, ou réessayez.'
          );
        } else {
          setError(msg || 'Identifiants invalides');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Store credentials for retry
    credentialsRef.current = { email, password };
    setRetryCount(0);
    await attemptLogin(email, password, 0);
  };

  const handleCancelRetry = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setWarmingUp(false);
    setLoading(false);
    setRetryCount(0);
    setCountdown(0);
  };

  const roleLabel: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'Administrateur', color: 'text-purple-700 bg-purple-50' },
    STAFF: { label: 'Personnel',      color: 'text-blue-700 bg-blue-50' },
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
              <span className="text-gold font-serif font-bold text-2xl">S</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary">Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">Hotel SETIFANA — Back-office</p>
            <div className="flex justify-center gap-2 mt-3">
              {Object.entries(roleLabel).map(([role, { label, color }]) => (
                <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Cold-start banner */}
          {warmingUp && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-4 text-sm">
              <Wifi className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <p className="font-semibold">Serveur en cours de démarrage…</p>
                <p className="text-xs mt-1 text-amber-700 leading-relaxed">
                  Le serveur se réveille après une période d&apos;inactivité
                  (démarrage ~30–60 s). Nouvelle tentative dans{' '}
                  <span className="font-bold tabular-nums">{countdown}s</span>
                  {' '}· {retryCount}/{MAX_RETRIES}
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${((MAX_RETRIES - retryCount) / MAX_RETRIES) * 100}%` }}
                  />
                </div>
                <button
                  onClick={handleCancelRetry}
                  className="text-xs text-amber-600 hover:text-amber-800 underline mt-2"
                >
                  Annuler et réessayer manuellement
                </button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && !warmingUp && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center mb-1.5">
                <Mail className="w-4 h-4 mr-1 text-gold" />Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@setifana.com"
                autoComplete="email"
                disabled={warmingUp}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center mb-1.5">
                <Lock className="w-4 h-4 mr-1 text-gold" />Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={warmingUp}
                required
              />
            </div>
            <Button
              variant="gold"
              size="lg"
              type="submit"
              className="w-full"
              disabled={loading || warmingUp}
            >
              {loading && !warmingUp
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connexion…</>
                : warmingUp
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Serveur en démarrage…</>
                  : 'Se connecter'
              }
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-gold transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Accès réservé au personnel autorisé (ADMIN / STAFF)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
