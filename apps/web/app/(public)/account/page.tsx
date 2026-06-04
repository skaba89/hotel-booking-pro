'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User, Phone, Mail, CalendarCheck, LogOut, Save, Loader2, CheckCircle, ChevronRight, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW:   'bg-gray-100 text-gray-600',
};

const STATUS_FR: Record<string, string> = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW:   'Non présenté',
};

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  totalAmount: number;
  currency: string;
  nights: number;
  room?: { name: string; images?: { imageUrl: string; altText?: string }[] };
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }

    Promise.all([
      api.get<UserProfile>('/auth/me').catch(() => null),
      api.get<Booking[]>('/auth/my-bookings').catch(() => []),
    ]).then(([prof, bkgs]) => {
      if (prof) {
        const p = prof as any;
        setProfile(p);
        setEditName(p.fullName || '');
        setEditPhone(p.phone || '');
      }
      setBookings((bkgs as any) || []);
    }).finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await api.patch<UserProfile>('/auth/profile', {
        fullName: editName,
        phone: editPhone,
      });
      setProfile(updated as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Vous devez être connecté pour accéder à votre compte.</p>
          <Link href="/"><Button variant="gold">Retour à l&apos;accueil</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg sm:text-xl font-bold truncate">{profile.fullName}</h1>
              <p className="text-white/60 text-xs sm:text-sm truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white/70 hover:text-red-300 transition-colors text-xs sm:text-sm flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Déconnexion</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-gold text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Mon profil
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bookings'
                ? 'border-gold text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Mes réservations
            {bookings.length > 0 && (
              <span className="bg-gold/30 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {bookings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-gold" /> Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
              )}
              {saved && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Profil mis à jour avec succès
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                    <User className="w-3.5 h-3.5 text-gold" /> Nom complet
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Votre nom"
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-gold" /> Téléphone
                  </label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+224 6XX XXX XXX"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold" /> Email
                  </label>
                  <Input value={profile.email} disabled className="bg-gray-50 text-muted-foreground" />
                  {profile.emailVerifiedAt ? (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3" /> Email vérifié
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">
                      Email non vérifié —{' '}
                      <Link href="/resend-verification" className="underline hover:text-amber-700">
                        renvoyer le lien
                      </Link>
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="gold" className="w-full sm:w-auto" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</> : <><Save className="w-4 h-4 mr-2" /> Sauvegarder</>}
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t">
                <p className="text-xs text-muted-foreground">
                  Membre depuis le {new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <Link href="/forgot-password" className="text-xs text-gold hover:underline mt-1 inline-block">
                  Changer mon mot de passe
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Vous n&apos;avez pas encore de réservation.</p>
                  <Link href="/rooms" className="mt-3 inline-block">
                    <Button variant="gold" size="sm">Découvrir nos chambres</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              bookings.map((b) => (
                <Card key={b.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Room thumbnail */}
                      {b.room?.images?.[0]?.imageUrl ? (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={b.room.images[0].imageUrl}
                            alt={b.room.images[0].altText || b.room?.name || 'Chambre'}
                            fill
                            className="rounded-lg object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <BedDouble className="w-6 h-6 text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-primary">{b.room?.name || 'Chambre'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{b.bookingReference}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[b.bookingStatus] || 'bg-gray-100'}`}>
                            {STATUS_FR[b.bookingStatus] || b.bookingStatus}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="w-3 h-3" />
                            {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                          </span>
                          <span>{b.nights} nuit{b.nights > 1 ? 's' : ''}</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(Number(b.totalAmount))}
                          </p>
                          <Link
                            href={`/track?ref=${b.bookingReference}`}
                            className="flex items-center gap-0.5 text-xs text-gold hover:underline"
                          >
                            Suivre <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
