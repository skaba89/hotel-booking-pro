import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { FeatureGate } from '@/components/ui/feature-gate';

const WhatsAppButton = dynamic(() => import('@/components/ui/whatsapp-button').then(m => m.WhatsAppButton), { ssr: false });
const SocialProofToast = dynamic(() => import('@/components/ui/social-proof').then(m => m.SocialProofToast), { ssr: false });
const Chatbot = dynamic(() => import('@/components/ui/chatbot').then(m => m.Chatbot), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/ui/cookie-consent').then(m => m.CookieConsent), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/ui/scroll-to-top').then(m => m.ScrollToTop), { ssr: false });

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Aller au contenu principal
      </a>
      <Header />
      <main id="main-content" className="min-h-screen pt-20">{children}</main>
      <Footer />
      <ScrollToTop />
      <FeatureGate feature="feature_whatsapp"><WhatsAppButton /></FeatureGate>
      <FeatureGate feature="feature_social_proof"><SocialProofToast /></FeatureGate>
      <FeatureGate feature="feature_chatbot"><Chatbot /></FeatureGate>
      <FeatureGate feature="feature_cookie_consent"><CookieConsent /></FeatureGate>
    </>
  );
}
