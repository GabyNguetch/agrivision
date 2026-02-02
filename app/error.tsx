'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
          Une erreur est survenue
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {error.message || 'Désolé, quelque chose s\'est mal passé. Veuillez réessayer.'}
        </p>
        
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
        >
          <RefreshCw className="w-5 h-5" />
          Réessayer
        </button>
      </div>
    </div>
  );
}