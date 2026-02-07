'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Leaf, TrendingUp, TrendingDown, BarChart3,
  Calendar, MapPin, Package, Users, Award, Activity,
  PieChart, LineChart, Database, Sparkles, ChevronDown,
  Filter, RefreshCw, Download, Eye, EyeOff,
} from 'lucide-react';
import {
  LineChart as RechartsLine,
  Line,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';
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
  getBassins,
  getProductionsParAnnee,
  getProductionsParRegion,
  getProductionsParProduit,
} from '@/lib/api';
import { SkeletonStat } from '@/components/Skeleton';

// Couleurs pour les graphiques
const COLORS = [
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
];

const GRADIENT_COLORS = [
  { start: '#22c55e', end: '#10b981' },
  { start: '#3b82f6', end: '#06b6d4' },
  { start: '#f59e0b', end: '#ef4444' },
  { start: '#8b5cf6', end: '#ec4899' },
];

export default function StatsPage() {
  // États pour les données
  const [statsGlobales, setStatsGlobales] = useState<any>(null);
  const [statsProduction, setStatsProduction] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [topRegions, setTopRegions] = useState<any[]>([]);
  const [topProduits, setTopProduits] = useState<any[]>([]);
  const [comparaison, setComparaison] = useState<any>(null);
  const [productionsParAnnee, setProductionsParAnnee] = useState<any[]>([]);
  const [productionsParRegion, setProductionsParRegion] = useState<any[]>([]);
  const [productionsParProduit, setProductionsParProduit] = useState<any[]>([]);
  
  // États pour les filtres
  const [annees, setAnnees] = useState<number[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [bassins, setBassins] = useState<any[]>([]);

  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<number | null>(null);
  const [selectedProduit, setSelectedProduit] = useState<number | null>(null);
  const [selectedBassin, setSelectedBassin] = useState<number | null>(null);
  const [anneeRef, setAnneeRef] = useState<number | null>(null);
  const [anneeCmp, setAnneeCmp] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'distribution' | 'comparison' | 'bassins'>('overview');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAnnee || selectedFiliere || selectedProduit || selectedBassin) {
      loadFilteredData();
    }
  }, [selectedAnnee, selectedFiliere, selectedProduit, selectedBassin]);

  useEffect(() => {
    if (anneeRef && anneeCmp && anneeRef !== anneeCmp) {
      loadComparaison();
    }
  }, [anneeRef, anneeCmp]);

  const loadInitialData = async () => {
    console.log('📊 [StatsPage] Loading initial data...');
    setLoading(true);

    try {
      const [
        globales,
        production,
        anneesData,
        filieresData,
        produitsData,
        bassinsData,
        parAnnee,
        parRegion,
        parProduit,
      ] = await Promise.all([
        getStatistiquesGlobales(),
        getStatistiquesProduction(),
        getAnneesDisponibles(),
        getFilieres(0, 100),
        getProduits(0, 100),
        getBassins(0, 100),
        getProductionsParAnnee(),
        getProductionsParRegion(),
        getProductionsParProduit(),
      ]);

      setStatsGlobales(globales);
      setStatsProduction(production);
      setAnnees(anneesData.sort((a: number, b: number) => b - a));
      setFilieres(filieresData.items);
      setProduits(produitsData.items);
      setBassins(bassinsData.items);
      setProductionsParAnnee(parAnnee);
      setProductionsParRegion(parRegion);
      setProductionsParProduit(parProduit);

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
      const [evo, regions, products, parAnnee, parRegion, parProduit] = await Promise.all([
        getEvolutionProduction(selectedProduit || undefined, undefined, undefined, undefined),
        getTopRegions(selectedAnnee || undefined, selectedProduit || undefined, 10),
        getTopProduits(selectedAnnee || undefined, undefined, 10),
        getProductionsParAnnee(selectedProduit || undefined, undefined, undefined, undefined),
        getProductionsParRegion(selectedAnnee || undefined, selectedProduit || undefined),
        getProductionsParProduit(selectedAnnee || undefined, undefined),
      ]);

      setEvolution(evo);
      setTopRegions(regions);
      setTopProduits(products);
      setProductionsParAnnee(parAnnee);
      setProductionsParRegion(parRegion);
      setProductionsParProduit(parProduit);

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
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'comparison', label: 'Comparaison', icon: BarChart3 },
    { id: 'bassins', label: 'Bassins', icon: MapPin },
  ] as const;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {fmt(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white">Statistiques Avancées</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Analyse des productions agricoles</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={loadInitialData}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slideDown">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Année
              </label>
              <select
                value={selectedAnnee || ''}
                onChange={e => setSelectedAnnee(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Toutes les années</option>
                {annees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Filière
              </label>
              <select
                value={selectedFiliere || ''}
                onChange={e => setSelectedFiliere(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Package className="w-3 h-3" /> Produit
              </label>
              <select
                value={selectedProduit || ''}
                onChange={e => setSelectedProduit(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Tous les produits</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Bassin
              </label>
              <select
                value={selectedBassin || ''}
                onChange={e => setSelectedBassin(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Tous les bassins</option>
                {bassins.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedAnnee(null);
                  setSelectedFiliere(null);
                  setSelectedProduit(null);
                  setSelectedBassin(null);
                  loadInitialData();
                }}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-800'
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
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      label: 'Régions', 
                      value: statsGlobales?.total_regions, 
                      icon: MapPin, 
                      gradient: 'from-blue-400 to-blue-600',
                      trend: '+2%'
                    },
                    { 
                      label: 'Filières', 
                      value: statsGlobales?.total_filieres, 
                      icon: Leaf, 
                      gradient: 'from-green-400 to-green-600',
                      trend: 'Stable'
                    },
                    { 
                      label: 'Produits', 
                      value: statsGlobales?.total_produits, 
                      icon: Package, 
                      gradient: 'from-purple-400 to-purple-600',
                      trend: '+12%'
                    },
                    { 
                      label: 'Productions', 
                      value: statsGlobales?.total_productions, 
                      icon: TrendingUp, 
                      gradient: 'from-orange-400 to-orange-600',
                      trend: '+8%'
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div 
                        key={i} 
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 animate-slideUp"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {stat.trend}
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-display">
                          {fmt(stat.value)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Production Stats Card */}
                  {statsProduction && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm animate-slideUp">
                      <div className="flex items-center gap-2 mb-6">
                        <Database className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Statistiques de production</h2>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {Object.entries(statsProduction).slice(0, 6).map(([key, value]: [string, any], idx) => (
                          <div key={key} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {typeof value === 'number' ? fmt(value) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bassins Pie Chart */}
                  {bassins.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm animate-slideUp">
                      <div className="flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Répartition des bassins</h2>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                          <Pie
                            data={bassins.slice(0, 8).map((b, i) => ({ name: b.nom, value: i + 1 }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {bassins.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evolution Tab */}
            {activeTab === 'evolution' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Evolution Line Chart */}
                {productionsParAnnee.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Évolution de la production</h2>
                      </div>
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLine data={productionsParAnnee}>
                        <defs>
                          <linearGradient id="colorQuantite" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis 
                          dataKey="annee" 
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => fmt(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="total_quantite" 
                          name="Quantité totale"
                          stroke="#22c55e" 
                          strokeWidth={3}
                          dot={{ fill: '#22c55e', r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                        {productionsParAnnee[0]?.total_valeur_fcfa !== undefined && (
                          <Line 
                            type="monotone" 
                            dataKey="total_valeur_fcfa" 
                            name="Valeur (FCFA)"
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 5 }}
                          />
                        )}
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Area Chart */}
                {evolution.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Activity className="w-5 h-5 text-green-500" />
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tendances détaillées</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={evolution}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis dataKey="annee" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="total_quantite" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorArea)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Distribution Tab */}
            {activeTab === 'distribution' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Regional Distribution */}
                {productionsParRegion.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="w-5 h-5 text-green-500" />
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Distribution par région</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBar data={productionsParRegion.slice(0, 10)}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.7}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis 
                          dataKey="nom" 
                          stroke="#9ca3af" 
                          style={{ fontSize: '11px' }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="total_quantite" name="Quantité" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Product Distribution Pie */}
                  {productionsParProduit.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <Package className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Distribution par produit</h2>
                      </div>
                      <ResponsiveContainer width="100%" height={350}>
                        <RechartsPie>
                          <Pie
                            data={productionsParProduit.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ nom, percent }) => `${nom} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="total_quantite"
                          >
                            {productionsParProduit.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Radial Bar Chart */}
                  {topRegions.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top régions (radial)</h2>
                      </div>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="10%" 
                          outerRadius="90%" 
                          data={topRegions.slice(0, 5).map((r, i) => ({
                            name: r.nom || `Région ${r.region_id}`,
                            value: r.total_quantite,
                            fill: COLORS[i]
                          }))}
                        >
                          <RadialBar
                            minAngle={15}
                            label={{ position: 'insideStart', fill: '#fff' }}
                            background
                            clockWise
                            dataKey="value"
                          />
                          <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                          <Tooltip content={<CustomTooltip />} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comparison Tab */}
            {activeTab === 'comparison' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Comparaison entre années</h2>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Année de référence
                      </label>
                      <select
                        value={anneeRef || ''}
                        onChange={e => setAnneeRef(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Sélectionner...</option>
                        {annees.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {comparaison ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(comparaison).map(([key, value]: [string, any]) => {
                        if (key === 'annee_reference' || key === 'annee_comparaison') return null;
                        
                        const isPositive = typeof value === 'number' && value > 0;
                        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
                        
                        return (
                          <div key={key} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                {key.replace(/_/g, ' ')}
                              </div>
                              {typeof value === 'number' && (
                                <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                              )}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {typeof value === 'number' ? fmt(value) : String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Sélectionnez deux années différentes pour comparer
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bassins Tab */}
            {activeTab === 'bassins' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Bassins Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bassins.map((bassin, idx) => (
                    <div 
                      key={bassin.id} 
                      className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 animate-slideUp"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{bassin.nom}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Code: {bassin.code}</p>
                          </div>
                        </div>
                        {bassin.importance && (
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            bassin.importance === 'haute' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            bassin.importance === 'moyenne' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {bassin.importance}
                          </span>
                        )}
                      </div>
                      
                      {bassin.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {bassin.description}
                        </p>
                      )}
                      
                      {bassin.produits_dominants && bassin.produits_dominants.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Produits dominants:</p>
                          <div className="flex flex-wrap gap-1">
                            {bassin.produits_dominants.slice(0, 3).map((produit: string, i: number) => (
                              <span 
                                key={i}
                                className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800"
                              >
                                {produit}
                              </span>
                            ))}
                            {bassin.produits_dominants.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
                                +{bassin.produits_dominants.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Top Products & Regions */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Top Products */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Award className="w-5 h-5 text-green-500" />
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Produits</h2>
                    </div>
                    <div className="space-y-3">
                      {topProduits.map((produit: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 hover:scale-105 transition-transform">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                            i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                            'bg-gradient-to-br from-green-400 to-green-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {produit.nom || `Produit ${produit.produit_id}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {fmt(produit.total_quantite)} unités • {fmtFCFA(produit.total_valeur_fcfa)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Regions */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Award className="w-5 h-5 text-blue-500" />
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Régions</h2>
                    </div>
                    <div className="space-y-3">
                      {topRegions.map((region: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                            i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                            'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {region.nom || `Région ${region.region_id}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {fmt(region.total_quantite)} unités • {fmtFCFA(region.total_valeur_fcfa)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}