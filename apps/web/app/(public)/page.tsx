import { Metadata } from 'next';
import { HeroSection } from '@/components/layout/hero-section';
import { SearchFormAdvanced } from '@/components/booking/search-form-advanced';
import { FeaturedRooms } from '@/components/rooms/featured-rooms';
import { ServicesPreview } from '@/components/layout/services-preview';
import { TestimonialsSection } from '@/components/layout/testimonials-section';
import { LocationSection } from '@/components/layout/location-section';
import { CTASection } from '@/components/layout/cta-section';
import { NewsletterSection } from '@/components/ui/newsletter';
import { StatsCounter } from '@/components/ui/stats-counter';
import { serverGetFeaturedRooms } from '@/lib/server-api';

export const revalidate = 120; // ISR: home page cached for 2 min

export const metadata: Metadata = {
  title: 'Hotel SETIFANA - Hotel de luxe a Conakry, Guinee',
  description: "Reservez votre sejour a l'Hotel SETIFANA, hotel de luxe a Conakry. Chambres premium, restaurant gastronomique, piscine, spa et salle de conference.",
  keywords: 'hotel conakry, hotel guinee, hotel luxe conakry, setifana, reservation hotel guinee, hebergement conakry',
  openGraph: {
    title: 'Hotel SETIFANA - Hotel de luxe a Conakry, Guinee',
    description: "L'excellence de l'hospitalite africaine. Chambres elegantes, cuisine raffinee et service d'exception au coeur de Conakry.",
    images: ['/images/hotel/hero-main.jpg'],
    locale: 'fr_FR',
    type: 'website',
  },
};

export default async function HomePage() {
  // Fetch featured rooms server-side — baked into the pre-rendered HTML
  const featuredRooms = await serverGetFeaturedRooms();

  return (
    <>
      <HeroSection />
      <SearchFormAdvanced />
      <StatsCounter />
      <FeaturedRooms rooms={featuredRooms} />
      <ServicesPreview />
      <TestimonialsSection />
      <LocationSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
