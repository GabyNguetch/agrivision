'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Leaf, TrendingUp, TrendingDown, BarChart3,
  Calendar, MapPin, Package, Users, Award, Activity,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import {
  getStatistiquesGlobales,
  getStatistiquesProduction,
  getEvolutionProduction,
  getTopRegions,
  getTopProduits,
  comparerAnnees,
  getAnneesDisponibles,
  getFilieres,
  getProduits,
} from '@/lib/api';
import { SkeletonStat } from '@/components/Skeleton';

export default function StatsPage() {
  const [statsGlobales, setStatsGlobales] = useState<any>(null);
  const [statsProduction, setStatsProduction] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [topRegions, setTopRegions] = useState<any[]>([]);
  const [topProduits, setTopProduits] = useState<any[]>([]);
  const [comparaison, setComparaison] = useState<any>(null);
  const [annees, setAnnees] = useState<number[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);

  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<number | null>(null);
  const [selectedProduit, setSelectedProduit] = useState<number | null>(null);
  const [anneeRef, setAnneeRef] = useState<number | null>(null);
  const [anneeCmp, setAnneeCmp] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'top' | 'comparison'>('overview');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAnnee || selectedFiliere || selectedProduit) {
      loadFilteredData();
    }
  }, [selectedAnnee, selectedFiliere, selectedProduit]);

  useEffect(() => {
    if (anneeRef && anneeCmp && anneeRef !== anneeCmp) {
      loadComparaison();
    }
  }, [anneeRef, anneeCmp]);

  const loadInitialData = async () => {
    console.log('📊 [StatsPage] Loading initial data...');
    setLoading(true);

    try {
      const [globales, production, anneesData, filieresData, produitsData] = await Promise.all([
        getStatistiquesGlobales(),
        getStatistiquesProduction(),
        getAnneesDisponibles(),
        getFilieres(0, 100),
        getProduits(0, 100),
      ]);

      setStatsGlobales(globales);
      setStatsProduction(production);
      setAnnees(anneesData.sort((a: number, b: number) => b - a));
      setFilieres(filieresData.items);
      setProduits(produitsData.items);

      // Charger top regions et produits
      const [regions, products] = await Promise.all([
        getTopRegions(undefined, undefined, 10),
        getTopProduits(undefined, undefined, 10),
      ]);

      setTopRegions(regions);
      setTopProduits(products);

      console.log('✅ [StatsPage] Initial data loaded');
    } catch (error) {
      console.error('❌ [StatsPage] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredData = async () => {
    console.log('🔄 [StatsPage] Loading filtered data...');
    
    try {
      const [evo, regions, products] = await Promise.all([
        getEvolutionProduction(selectedProduit || undefined, undefined, undefined, undefined),
        getTopRegions(selectedAnnee || undefined, selectedProduit || undefined, 10),
        getTopProduits(selectedAnnee || undefined, undefined, 10),
      ]);

      setEvolution(evo);
      setTopRegions(regions);
      setTopProduits(products);

      console.log('✅ [StatsPage] Filtered data loaded');
    } catch (error) {
      console.error('❌ [StatsPage] Error loading filtered data:', error);
    }
  };

  const loadComparaison = async () => {
    if (!anneeRef || !anneeCmp) return;

    console.log(`🔄 [StatsPage] Comparing years ${anneeRef} vs ${anneeCmp}`);

    try {
      const comp = await comparerAnnees(anneeRef, anneeCmp, selectedProduit || undefined);
      setComparaison(comp);
      console.log('✅ [StatsPage] Comparison loaded');
    } catch (error) {
      console.error('❌ [StatsPage] Error loading comparison:', error);
    }
  };

  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat('fr-FR').format(n) : '—';

  const fmtFCFA = (n: number | null | undefined) =>
    n != null ? `${new Intl.NumberFormat('fr-FR').format(n)} FCFA` : '—';

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
    { id: 'evolution', label: 'Évolution', icon: TrendingUp },
    { id: 'top', label: 'Classements', icon: Award },
    { id: 'comparison', label: 'Comparaison', icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white">Statistiques</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Analyse des productions</p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              <Calendar className="w-3 h-3 inline mr-1" /> Année
            </label>
            <select
              value={selectedAnnee || ''}
              onChange={e => setSelectedAnnee(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">Toutes les années</option>
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              <Leaf className="w-3 h-3 inline mr-1" /> Filière
            </label>
            <select
              value={selectedFiliere || ''}
              onChange={e => setSelectedFiliere(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              <Package className="w-3 h-3 inline mr-1" /> Produit
            </label>
            <select
              value={selectedProduit || ''}
              onChange={e => setSelectedProduit(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">Tous les produits</option>
              {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 anim-fadeIn">
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Régions', value: statsGlobales?.total_regions, icon: MapPin, color: 'blue' },
                    { label: 'Filières', value: statsGlobales?.total_filieres, icon: Leaf, color: 'green' },
                    { label: 'Produits', value: statsGlobales?.total_produits, icon: Package, color: 'purple' },
                    { label: 'Productions', value: statsGlobales?.total_productions, icon: TrendingUp, color: 'orange' },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-3 rounded-xl bg-${stat.color}-500`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {fmt(stat.value)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Production Stats */}
                {statsProduction && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Statistiques de production</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(statsProduction).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {typeof value === 'number' ? fmt(value) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evolution Tab */}
            {activeTab === 'evolution' && (
              <div className="anim-fadeIn">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Évolution de la production</h2>
                  {evolution.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Sélectionnez un produit pour voir son évolution
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {evolution.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{item.annee || item.periode}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.nombre_productions || 0} production{(item.nombre_productions || 0) > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {fmt(item.total_quantite || item.quantite)}
                            </div>
                            {item.total_valeur_fcfa && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {fmtFCFA(item.total_valeur_fcfa)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Tab */}
            {activeTab === 'top' && (
              <div className="grid md:grid-cols-2 gap-6 anim-fadeIn">
                {/* Top Regions */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" /> Top Régions
                  </h2>
                  <div className="space-y-3">
                    {topRegions.map((region: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {region.nom || `Région ${region.region_id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fmt(region.total_quantite)} • {fmtFCFA(region.total_valeur_fcfa)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Produits */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-500" /> Top Produits
                  </h2>
                  <div className="space-y-3">
                    {topProduits.map((produit: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          i === 0 ? 'bg-green-500' : i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {produit.nom || `Produit ${produit.produit_id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fmt(produit.total_quantite)} • {fmtFCFA(produit.total_valeur_fcfa)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Tab */}
            {activeTab === 'comparison' && (
              <div className="anim-fadeIn space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Comparaison entre années</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Année de référence
                      </label>
                      <select
                        value={anneeRef || ''}
                        onChange={e => setAnneeRef(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <option value="">Sélectionner...</option>
                        {annees.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Année de comparaison
                      </label>
                      <select
                        value={anneeCmp || ''}
                        onChange={e => setAnneeCmp(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <option value="">Sélectionner...</option>
                        {annees.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {comparaison ? (
                    <div className="space-y-4">
                      {Object.entries(comparaison).map(([key, value]: [string, any]) => {
                        if (key === 'annee_reference' || key === 'annee_comparaison') return null;
                        return (
                          <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {typeof value === 'number' ? fmt(value) : String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Sélectionnez deux années différentes pour comparer
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}