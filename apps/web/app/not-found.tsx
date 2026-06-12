import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071B33] to-[#0a2a4f]">
      <div className="text-center px-4">
        <h1 className="font-serif text-8xl font-bold text-[#C8A45D] mb-4">404</h1>
        <h2 className="font-serif text-2xl font-bold text-white mb-2">Page introuvable</h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#C8A45D] hover:bg-[#b8943d] text-white font-medium rounded-lg transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white hover:bg-white/10 font-medium rounded-lg transition-colors"
          >
            Voir nos chambres
          </Link>
        </div>
      </div>
    </div>
  );
}
