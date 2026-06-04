'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
              <span className="text-gold font-serif font-bold text-2xl">S</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary">Vérification email</h1>
            <p className="text-sm text-muted-foreground mt-1">Hôtel SETIFANA</p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Si un compte non vérifié existe pour cet email, un nouveau lien de vérification
                a été envoyé. Vérifiez votre boîte de réception (et les spams).
              </p>
              <Link href="/">
                <Button variant="gold" className="w-full">
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center mb-1.5">
                    <Mail className="w-4 h-4 mr-1 text-gold" />
                    Adresse email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <Button variant="gold" size="lg" type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Envoi en cours…' : 'Renvoyer le lien de vérification'}
                </Button>
              </form>

              <div className="text-center mt-4">
                <Link href="/" className="text-xs text-muted-foreground hover:text-gold transition-colors">
                  Retour à l&apos;accueil
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
