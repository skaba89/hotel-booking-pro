'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    async function verify() {
      try {
        const res = await api.post<{ message: string }>('/auth/verify-email', { token });
        setMessage((res as any).message || 'Email vérifié avec succès.');
        setStatus('success');
      } catch (err: any) {
        setMessage(
          err?.message ||
          'Lien invalide ou expiré. Veuillez demander un nouvel email de vérification.',
        );
        setStatus('error');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-5">
          {/* Logo */}
          <div className="w-14 h-14 mx-auto bg-primary rounded-full flex items-center justify-center">
            <span className="text-gold font-serif font-bold text-2xl">S</span>
          </div>

          {status === 'verifying' && (
            <>
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto" />
              <h1 className="font-serif text-xl font-bold text-primary">
                Vérification en cours…
              </h1>
              <p className="text-sm text-muted-foreground">
                Patientez quelques instants.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h1 className="font-serif text-xl font-bold text-primary">
                Email vérifié !
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link href="/">
                <Button variant="gold" className="w-full mt-2">
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h1 className="font-serif text-xl font-bold text-primary">
                Lien invalide
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link href="/resend-verification">
                <Button variant="outline" className="w-full">
                  Renvoyer l&apos;email de vérification
                </Button>
              </Link>
              <Link href="/" className="block text-xs text-muted-foreground hover:text-gold transition-colors">
                Retour à l&apos;accueil
              </Link>
            </>
          )}

          {status === 'no-token' && (
            <>
              <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h1 className="font-serif text-xl font-bold text-primary">
                Vérifiez votre email
              </h1>
              <p className="text-sm text-muted-foreground">
                Un lien de vérification vous a été envoyé par email lors de votre inscription.
                Cliquez sur ce lien pour activer votre compte.
              </p>
              <Link href="/resend-verification">
                <Button variant="outline" className="w-full">
                  Renvoyer l&apos;email
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
