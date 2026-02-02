'use client';

import Link from 'next/link';
import { Home, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6">
          <MapPin className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-9xl font-display font-extrabold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        
        <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
          Page non trouvée
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <Home className="w-5 h-5" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}