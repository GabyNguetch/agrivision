'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  TrendingUp,
  Leaf,
  Waves,
  Database,
  ArrowRight,
  BarChart3,
  Globe,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { getStatistiquesGlobales } from '@/lib/api';
import { SkeletonStat } from '@/components/Skeleton';

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStatistiquesGlobales();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: 'Cartographie Interactive',
      description: 'Explorez les divisions administratives du Cameroun avec une carte interactive et intuitive',
      color: 'from-green-400 to-emerald-600',
    },
    {
      icon: Leaf,
      title: 'Données Agricoles',
      description: 'Accédez aux données de production agricole par région, département et commune',
      color: 'from-lime-400 to-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Statistiques en Temps Réel',
      description: 'Visualisez les tendances et évolutions de la production sur plusieurs années',
      color: 'from-emerald-400 to-teal-600',
    },
    {
      icon: Waves,
      title: 'Zones Halieutiques',
      description: 'Découvrez les zones de pêche maritimes, fluviales et lacustres',
      color: 'from-cyan-400 to-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-6 py-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'slideRight 0.5s ease-out' }}>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                AgriVision
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Cartographie Agricole
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
            <Link
              href="/map"
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', animation: 'slideLeft 0.5s ease-out' }}
            >
              Accéder à la carte
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" style={{ animation: 'slideUp 0.7s ease-out' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full mb-6" style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Plateforme de cartographie interactive</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-display font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Explorez les Données
              <br />
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                Agricoles du Cameroun
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Une plateforme moderne pour visualiser et analyser les données de production agricole, 
              pastorale et halieutique à travers les 10 régions du Cameroun.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href="/map"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl text-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <Globe className="w-6 h-6" />
                Découvrir la carte
                <ArrowRight className="w-6 h-6" />
              </Link>
              
              <button className="px-8 py-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all transform hover:scale-105 shadow-lg text-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <BarChart3 className="w-6 h-6" />
                Voir les statistiques
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20" style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonStat key={i} />
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20" style={{ animation: 'slideUp 0.8s ease-out' }}>
              {[
                { label: 'Régions', value: stats.total_regions, icon: MapPin, color: 'bg-blue-500' },
                { label: 'Départements', value: stats.total_departements, icon: Database, color: 'bg-purple-500' },
                { label: 'Filières', value: stats.total_filieres, icon: Leaf, color: 'bg-green-500' },
                { label: 'Produits', value: stats.total_produits, icon: TrendingUp, color: 'bg-orange-500' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all transform hover:scale-105 hover:shadow-2xl cursor-pointer"
                    style={{ animation: `slideUp 0.${8 + index}s ease-out` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div className={`p-3 ${stat.color} rounded-xl`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        Total
                      </div>
                    </div>
                    <div className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all transform hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden"
                  style={{ animation: `slideUp ${1 + index * 0.1}s ease-out` }}
                >
                  {/* Gradient Background on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300`}
                  />
                  
                  <div className="relative z-10">
                    <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 transform transition-transform duration-300 ${hoveredCard === index ? 'scale-110 rotate-3' : ''}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center" style={{ animation: 'slideUp 1.2s ease-out' }}>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6">
            Prêt à explorer les données ?
          </h2>
          <p className="text-xl text-green-50 mb-8">
            Accédez à la carte interactive et découvrez les bassins de production du Cameroun
          </p>
          <Link
            href="/map"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-green-600 font-bold rounded-xl text-lg transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl"
          >
            <Globe className="w-7 h-7" />
            Commencer l'exploration
            <ArrowRight className="w-7 h-7" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-white">
              AgriVision
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 AgriVision. Plateforme de cartographie agricole du Cameroun.
          </p>
        </div>
      </footer>
    </div>
  );
}