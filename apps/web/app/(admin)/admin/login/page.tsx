'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { adminLogin, saveAuthToken, loadAuthToken } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated with ADMIN/STAFF role, skip to dashboard
  useEffect(() => {
    const token = loadAuthToken();
    const userRaw = localStorage.getItem('user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.role === 'ADMIN' || user.role === 'STAFF') {
          const params = new URLSearchParams(window.location.search);
          router.replace(params.get('redirect') || '/admin/dashboard');
        }
      } catch { /* ignore */ }
    }
    // Show session-expired message if redirected with ?expired=1
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('expired') === '1') {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminLogin(email, password);

      // ── Role check — only ADMIN and STAFF can access the back-office ──────
      if (data.user.role !== 'ADMIN' && data.user.role !== 'STAFF') {
        setError('Accès refusé. Ce compte n\'a pas les droits d\'administration.');
        setLoading(false);
        return;
      }

      // ── Persist token and user ────────────────────────────────────────────
      saveAuthToken(data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/admin/dashboard';
      router.replace(redirect);
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'Administrateur', color: 'text-purple-700 bg-purple-50' },
    STAFF: { label: 'Personnel', color: 'text-blue-700 bg-blue-50' },
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
              <span className="text-gold font-serif font-bold text-2xl">S</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary">Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">Hotel SETIFANA — Back-office</p>

            {/* Role badges */}
            <div className="flex justify-center gap-2 mt-3">
              {Object.entries(roleLabel).map(([role, { label, color }]) => (
                <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center mb-1.5">
                <Mail className="w-4 h-4 mr-1 text-gold" />Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@setifana.com"
                autoComplete="email"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <Button variant="gold" size="lg" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion en cours…' : 'Se connecter'}
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
