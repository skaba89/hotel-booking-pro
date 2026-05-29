import { Metadata } from 'next';
import Link from 'next/link';
import { Star, Award, Heart, Users, MapPin, Phone, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'À propos - Hotel SETIFANA',
  description: "Découvrez l'histoire de l'Hotel SETIFANA, hôtel de luxe à Conakry. Nos valeurs, notre équipe et notre engagement envers l'excellence.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hotel/hero-1.jpg)', backgroundSize: 'cover' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4].map((i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">À propos de SETIFANA</h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg">
            Une tradition d&apos;excellence et d&apos;hospitalité au cœur de Conakry.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-4">Notre Histoire</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Fondé avec la vision de créer un havre de luxe et de confort en Guinée, l&apos;Hotel SETIFANA
            incarne l&apos;excellence de l&apos;hospitalité africaine. Situé dans la magnifique Baie de Sangarea à Conakry,
            notre établissement a été conçu pour offrir une expérience unique alliant modernité et authenticité guinéenne.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Chaque détail a été pensé pour satisfaire les voyageurs les plus exigeants : des chambres
            élégamment décorées, une cuisine raffinée mêlant saveurs internationales et spécialités
            locales, et un service attentionné disponible 24 heures sur 24.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-12">
          {[
            { icon: Star, label: 'Excellence', desc: 'Service 4 étoiles', color: 'bg-amber-50 text-amber-600' },
            { icon: Award, label: 'Qualité', desc: 'Standards internationaux', color: 'bg-blue-50 text-blue-600' },
            { icon: Heart, label: 'Hospitalité', desc: 'Accueil chaleureux', color: 'bg-rose-50 text-rose-600' },
            { icon: Users, label: 'Équipe', desc: 'Personnel qualifié', color: 'bg-green-50 text-green-600' },
          ].map((item) => (
            <div key={item.label} className="text-center p-6 rounded-xl bg-secondary hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 mx-auto mb-3 ${item.color} rounded-full flex items-center justify-center`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-primary text-lg">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Heart, title: 'Engagement client', desc: 'Votre satisfaction est notre priorité absolue. Chaque interaction est une opportunité de vous impressionner.', color: 'text-rose-500' },
              { icon: MapPin, title: 'Authenticité', desc: 'Nous célébrons la culture guinéenne tout en offrant un confort de standard international.', color: 'text-amber-500' },
              { icon: Sparkles, title: 'Durabilité', desc: 'Nous nous engageons à minimiser notre impact environnemental et à contribuer au développement local.', color: 'text-green-500' },
              { icon: Shield, title: 'Innovation', desc: 'Technologies modernes et services digitaux pour une expérience fluide et sans friction.', color: 'text-blue-500' },
            ].map((item) => (
              <div key={item.title} className="p-6 border rounded-xl hover:border-gold/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <h3 className="font-semibold text-primary group-hover:text-gold transition-colors">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 bg-primary rounded-2xl p-8 text-white text-center">
          <h2 className="font-serif text-2xl font-bold mb-2">Venez nous rendre visite</h2>
          <p className="text-white/70 mb-6">Nous serons ravis de vous accueillir à Conakry</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="w-4 h-4 text-gold" />
              <span className="text-sm">Baie de Sangarea, Conakry</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Phone className="w-4 h-4 text-gold" />
              <a href="tel:+224666057620" className="text-sm hover:text-gold transition-colors">+224 666 05 76 20</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/booking">
              <Button variant="gold" size="lg">Réserver maintenant</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">Nous contacter</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
