'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Filter, MapPin, Layers, TrendingUp, X,
  ChevronDown, ChevronRight, Wheat, Package, Calendar,
  ExternalLink, Info,
} from 'lucide-react';
import type { Filiere, CategorieProduit, Produit, MapLevel } from '@/types/api';
import {
  getFilieres, getCategories, getProduits,
  searchFilieres, getAnneesDisponibles,
} from '@/lib/api';
import { SkeletonList } from './Skeleton';

interface SidebarProps {
  onFilterChange   : (filters: any) => void;
  onMapLevelChange : (level: MapLevel) => void;
  selectedEntity   : any;
  currentMapLevel  : MapLevel;
}

export default function Sidebar({
  onFilterChange,
  onMapLevelChange,
  selectedEntity,
  currentMapLevel,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState<'filters' | 'info'>('filters');

  const [filieres,   setFilieres]   = useState<Filiere[]>([]);
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [produits,   setProduits]   = useState<Produit[]>([]);
  const [annees,     setAnnees]     = useState<number[]>([]);

  const [selectedFiliere,   setSelectedFiliere]   = useState<number | null>(null);
  const [selectedCategorie, setSelectedCategorie] = useState<number | null>(null);
  const [selectedProduit,   setSelectedProduit]   = useState<number | null>(null);
  const [selectedAnnee,     setSelectedAnnee]     = useState<number | null>(null);

  const [openSections, setOpenSections] = useState({
    filieres: true, categories: false, produits: false,
    mapLevel: true, annee: false,
  });

  const [loading, setLoading] = useState(false);

  const prevFiltersRef     = useRef({ filiere_id: null as number|null, categorie_id: null as number|null, produit_id: null as number|null, annee: null as number|null });
  const onFilterChangeRef  = useRef(onFilterChange);
  useEffect(() => { onFilterChangeRef.current = onFilterChange; }, [onFilterChange]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => { loadFilieres(); loadAnnees(); }, []);

  // ── Cascade: filière → catégories ────────────────────────────────────────
  useEffect(() => {
    if (selectedFiliere) {
      loadCategories(selectedFiliere);
      setOpenSections(p => ({ ...p, categories: true }));
    } else {
      setCategories([]);
      setSelectedCategorie(null);
    }
  }, [selectedFiliere]);

  // ── Cascade: catégorie / filière → produits ──────────────────────────────
  useEffect(() => {
    if (selectedCategorie) {
      loadProduits(selectedCategorie, selectedFiliere);
      setOpenSections(p => ({ ...p, produits: true }));
    } else if (selectedFiliere) {
      loadProduits(undefined, selectedFiliere);
    } else {
      setProduits([]);
      setSelectedProduit(null);
    }
  }, [selectedCategorie, selectedFiliere]);

  // ── Notify parent only on real change ────────────────────────────────────
  useEffect(() => {
    const nf = { filiere_id: selectedFiliere, categorie_id: selectedCategorie, produit_id: selectedProduit, annee: selectedAnnee };
    const pv = prevFiltersRef.current;
    if (pv.filiere_id !== nf.filiere_id || pv.categorie_id !== nf.categorie_id || pv.produit_id !== nf.produit_id || pv.annee !== nf.annee) {
      prevFiltersRef.current = nf;
      onFilterChangeRef.current(nf);
    }
  }, [selectedFiliere, selectedCategorie, selectedProduit, selectedAnnee]);

  // ── When entity selected → auto-switch to info tab ───────────────────────
  useEffect(() => {
    if (selectedEntity) setActiveTab('info');
  }, [selectedEntity]);

  // ── Loaders ──────────────────────────────────────────────────────────────
  const loadFilieres = async () => {
    try { setLoading(true); const r = await getFilieres(0, 100); setFilieres(r.items); }
    catch (e) { console.error('loadFilieres', e); }
    finally { setLoading(false); }
  };
  const loadCategories = async (fId: number) => {
    try { const r = await getCategories(0, 100, fId); setCategories(r.items); }
    catch (e) { console.error('loadCategories', e); }
  };
  const loadProduits = async (cId?: number, fId?: number) => {
    try { const r = await getProduits(0, 100, cId, fId); setProduits(r.items); }
    catch (e) { console.error('loadProduits', e); }
  };
  const loadAnnees = async () => {
    try { const d = await getAnneesDisponibles(); setAnnees(d); }
    catch (e) { console.error('loadAnnees', e); }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    try { setLoading(true); setFilieres(await searchFilieres(searchQuery, 10)); }
    catch (e) { console.error('handleSearch', e); }
    finally { setLoading(false); }
  };

  const toggleSection = (s: keyof typeof openSections) =>
    setOpenSections(p => ({ ...p, [s]: !p[s] }));

  const resetFilters = () => {
    setSelectedFiliere(null); setSelectedCategorie(null);
    setSelectedProduit(null); setSelectedAnnee(null);
    setSearchQuery('');
    loadFilieres();
  };

  const mapLevelOptions: { value: MapLevel; label: string; icon: typeof MapPin }[] = [
    { value: 'regions',      label: 'Régions',      icon: MapPin },
    { value: 'departements', label: 'Départements', icon: Layers },
    { value: 'communes',     label: 'Communes',     icon: TrendingUp },
  ];

  // ── Detail URL helper ────────────────────────────────────────────────────
  const detailUrl = selectedEntity
    ? `/map/${selectedEntity.id}?level=${currentMapLevel}`
    : '#';

  // ── Shared button style ──────────────────────────────────────────────────
  const btnBase = (active: boolean) =>
    `w-full px-4 py-2.5 rounded-lg text-left transition-all duration-200 border-2 ${
      active
        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500 font-semibold'
        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/20'
    }`;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-50 to-white dark:from-gray-900 dark:to-gray-950">
        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Filtres &amp; Recherche</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Données agricoles du Cameroun</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['filters', 'info'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50/60 dark:bg-green-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'filters' ? <Filter className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            {tab === 'filters' ? 'Filtres' : 'Informations'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {activeTab === 'filters' ? (
          <>
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Recherche rapide
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Filière, produit…"
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
                <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 hover:opacity-70 transition-opacity">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Niveau de visualisation */}
            <div>
              <button onClick={() => toggleSection('mapLevel')} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Niveau</span>
                {openSections.mapLevel ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {openSections.mapLevel && (
                <div className="flex gap-2">
                  {mapLevelOptions.map(opt => {
                    const Icon = opt.icon;
                    const active = currentMapLevel === opt.value;
                    return (
                      <button key={opt.value} onClick={() => onMapLevelChange(opt.value)}
                        className={`flex-1 py-2 rounded-lg text-center text-xs font-semibold transition-all border-2 flex flex-col items-center gap-0.5 ${
                          active
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-green-300'
                        }`}>
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filières */}
            <div>
              <button onClick={() => toggleSection('filieres')} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5"><Wheat className="w-3.5 h-3.5" /> Filières <span className="text-green-600 dark:text-green-400">({filieres.length})</span></span>
                {openSections.filieres ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {openSections.filieres && (
                <div className="space-y-1.5">
                  {loading ? <SkeletonList count={3} /> : filieres.map(f => (
                    <button key={f.id} onClick={() => setSelectedFiliere(f.id === selectedFiliere ? null : f.id)} className={btnBase(selectedFiliere === f.id)}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: f.couleur || '#22c55e' }} />
                        <div className="min-w-0">
                          <div className="font-medium truncate text-sm">{f.nom}</div>
                          {f.description && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{f.description}</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Catégories */}
            {selectedFiliere && categories.length > 0 && (
              <div>
                <button onClick={() => toggleSection('categories')} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Catégories <span className="text-green-600 dark:text-green-400">({categories.length})</span></span>
                  {openSections.categories ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {openSections.categories && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-green-200 dark:border-green-800 ml-1.5">
                    {categories.map(c => (
                      <button key={c.id} onClick={() => setSelectedCategorie(c.id === selectedCategorie ? null : c.id)} className={btnBase(selectedCategorie === c.id)}>
                        <span className="text-sm">{c.nom}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Produits */}
            {produits.length > 0 && (
              <div>
                <button onClick={() => toggleSection('produits')} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Produits <span className="text-green-600 dark:text-green-400">({produits.length})</span></span>
                  {openSections.produits ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {openSections.produits && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-green-100 dark:border-green-900 ml-1.5">
                    {produits.slice(0, 12).map(p => (
                      <button key={p.id} onClick={() => setSelectedProduit(p.id === selectedProduit ? null : p.id)} className={btnBase(selectedProduit === p.id)}>
                        <div className="text-sm font-medium">{p.nom}</div>
                        {p.unite_mesure && <div className="text-xs text-gray-400 dark:text-gray-500">Unité : {p.unite_mesure}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Année */}
            <div>
              <button onClick={() => toggleSection('annee')} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Année</span>
                {openSections.annee ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {openSections.annee && annees.length > 0 && (
                <select value={selectedAnnee || ''} onChange={e => setSelectedAnnee(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                  <option value="">Toutes les années</option>
                  {annees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
            </div>

            {/* Reset */}
            <button onClick={resetFilters} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5">
              <X className="w-4 h-4" /> Réinitialiser
            </button>
          </>
        ) : (
          /* ── Info tab ─────────────────────────────────────────────────────── */
          <div className="space-y-3">
            {selectedEntity ? (
              <>
                {/* Entity card */}
                <div className="anim-slideUp bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-display font-bold text-gray-900 dark:text-white">
                      {selectedEntity.nom || 'Information'}
                    </h3>
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold capitalize">
                      {currentMapLevel.slice(0, -1)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(selectedEntity).map(([key, value]) => {
                      if (['id','created_at','updated_at'].includes(key) || !value) return null;
                      if (key === 'nom') return null; // already shown as title
                      return (
                        <div key={key} className="flex items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-1.5">
                          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium text-right max-w-[55%] truncate">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Voir Plus button */}
                <Link
                  href={detailUrl}
                  className="anim-slideUp delay-100 flex items-center justify-center gap-2.5 w-full px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <ExternalLink className="w-5 h-5" />
                  Voir plus — Page détail
                </Link>
              </>
            ) : (
              <div className="text-center py-16 anim-fadeIn">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cliquez sur une zone de la carte pour voir ses informations
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}