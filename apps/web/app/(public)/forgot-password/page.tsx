'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n/provider';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la demande');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary">HÔTEL SETIFANA</h1>
          <p className="text-muted-foreground mt-1 text-sm">Conakry, Guinée</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-primary mb-3">Email envoyé !</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Si un compte existe pour <strong>{email}</strong>, vous allez recevoir un lien
                de réinitialisation dans quelques minutes.
                <br />
                Pensez à vérifier vos spams.
              </p>
              <p className="text-xs text-muted-foreground mb-6">Le lien expire dans 1 heure.</p>
              <Link href="/admin/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-xl font-semibold text-primary">Mot de passe oublié ?</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                  {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
