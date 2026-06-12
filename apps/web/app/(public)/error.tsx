'use client';

import { useEffect } from 'react';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Une erreur est survenue</h2>
        <p className="text-gray-500 mb-6">
          Nous sommes desoles, quelque chose s&apos;est mal passe. Veuillez reessayer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#C8A45D] text-white rounded-lg font-medium hover:bg-[#B8943D] transition-colors"
          >
            Reessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Retour a l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
