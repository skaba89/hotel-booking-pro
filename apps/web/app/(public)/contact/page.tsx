'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { submitContact } from '@/lib/api';

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContact(form);
      setSuccess(true);
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Contactez-nous</h1>
          <p className="text-white/70">Notre équipe est à votre disposition pour toute question.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary mb-6">Envoyez-nous un message</h2>

            {success ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Message envoyé !</h3>
                  <p className="text-muted-foreground text-sm">Nous vous répondrons dans les plus brefs délais.</p>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium">Nom complet *</label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
                  <div><label className="text-sm font-medium">Email *</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium">Téléphone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="text-sm font-medium">Sujet</label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                </div>
                <div><label className="text-sm font-medium">Message *</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                <Button variant="gold" size="lg" type="submit" disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le message'}
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-primary mb-6">Nos coordonnées</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-secondary rounded-lg">
                <Phone className="w-5 h-5 text-gold mt-0.5" />
                <div><p className="font-medium">Téléphone</p><p className="text-sm text-muted-foreground">+224 666 05 76 20</p></div>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-secondary rounded-lg">
                <Mail className="w-5 h-5 text-gold mt-0.5" />
                <div><p className="font-medium">Email</p><p className="text-sm text-muted-foreground">contact@setifana.com</p></div>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-secondary rounded-lg">
                <MapPin className="w-5 h-5 text-gold mt-0.5" />
                <div><p className="font-medium">Adresse</p><p className="text-sm text-muted-foreground">H8XV+659 Baie de Sangaréa, Conakry, Guinée</p></div>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-secondary rounded-lg">
                <Clock className="w-5 h-5 text-gold mt-0.5" />
                <div><p className="font-medium">Réception</p><p className="text-sm text-muted-foreground">24h/24, 7j/7</p></div>
              </div>
              <a href="https://wa.me/224666057620" target="_blank" rel="noopener noreferrer" className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div><p className="font-medium text-green-800">WhatsApp</p><p className="text-sm text-green-700">Contactez-nous directement</p></div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
