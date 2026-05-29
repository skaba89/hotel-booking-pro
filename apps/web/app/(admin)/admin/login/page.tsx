'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { adminLogin, api } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminLogin(email, password);
      localStorage.setItem('user', JSON.stringify(data.user));
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/admin/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides');
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
            <h1 className="font-serif text-2xl font-bold text-primary">Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">Hotel SETIFANA - Back-office</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
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
                required
              />
            </div>
            <Button variant="gold" size="lg" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Accès réservé au personnel autorisé
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
