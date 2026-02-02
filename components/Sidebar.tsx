'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Layers,
  TrendingUp,
  X,
  ChevronDown,
  ChevronRight,
  Wheat,
  Package,
  Calendar,
} from 'lucide-react';
import type {
  Filiere,
  CategorieProduit,
  Produit,
  Region,
  Departement,
  Commune,
  MapLevel,
} from '@/types/api';
import {
  getFilieres,
  getCategories,
  getProduits,
  searchFilieres,
  searchProduits,
  getRegions,
  getDepartements,
  getCommunes,
  getAnneesDisponibles,
} from '@/lib/api';
import { SkeletonList } from './Skeleton';

interface SidebarProps {
  onFilterChange: (filters: any) => void;
  onMapLevelChange: (level: MapLevel) => void;
  selectedEntity: any;
  currentMapLevel: MapLevel;
}

export default function Sidebar({
  onFilterChange,
  onMapLevelChange,
  selectedEntity,
  currentMapLevel,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'filters' | 'info'>('filters');
  
  // États pour les filtres
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [annees, setAnnees] = useState<number[]>([]);
  
  // Sélections
  const [selectedFiliere, setSelectedFiliere] = useState<number | null>(null);
  const [selectedCategorie, setSelectedCategorie] = useState<number | null>(null);
  const [selectedProduit, setSelectedProduit] = useState<number | null>(null);
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null);
  
  // Sections ouvertes/fermées
  const [openSections, setOpenSections] = useState({
    filieres: true,
    categories: false,
    produits: false,
    mapLevel: false,
    annee: false,
  });
  
  const [loading, setLoading] = useState(false);

  // Charger les filières au montage
  useEffect(() => {
    loadFilieres();
    loadAnnees();
  }, []);

  // Charger les catégories quand une filière est sélectionnée
  useEffect(() => {
    if (selectedFiliere) {
      loadCategories(selectedFiliere);
      setOpenSections((prev) => ({ ...prev, categories: true }));
    } else {
      setCategories([]);
      setSelectedCategorie(null);
    }
  }, [selectedFiliere]);

  // Charger les produits quand une catégorie est sélectionnée
  useEffect(() => {
    if (selectedCategorie) {
      loadProduits(selectedCategorie, selectedFiliere);
      setOpenSections((prev) => ({ ...prev, produits: true }));
    } else if (selectedFiliere) {
      loadProduits(undefined, selectedFiliere);
    } else {
      setProduits([]);
      setSelectedProduit(null);
    }
  }, [selectedCategorie, selectedFiliere]);

  // Notifier les changements de filtre
  useEffect(() => {
    onFilterChange({
      filiere_id: selectedFiliere,
      categorie_id: selectedCategorie,
      produit_id: selectedProduit,
      annee: selectedAnnee,
    });
  }, [selectedFiliere, selectedCategorie, selectedProduit, selectedAnnee]);

  const loadFilieres = async () => {
    try {
      setLoading(true);
      const response = await getFilieres(0, 100);
      setFilieres(response.items);
    } catch (error) {
      console.error('Erreur lors du chargement des filières:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (filiereId: number) => {
    try {
      const response = await getCategories(0, 100, filiereId);
      setCategories(response.items);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadProduits = async (categorieId?: number, filiereId?: number) => {
    try {
      const response = await getProduits(0, 100, categorieId, filiereId);
      setProduits(response.items);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const loadAnnees = async () => {
    try {
      const data = await getAnneesDisponibles();
      setAnnees(data);
    } catch (error) {
      console.error('Erreur lors du chargement des années:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    try {
      setLoading(true);
      const results = await searchFilieres(searchQuery, 10);
      setFilieres(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const resetFilters = () => {
    setSelectedFiliere(null);
    setSelectedCategorie(null);
    setSelectedProduit(null);
    setSelectedAnnee(null);
    setSearchQuery('');
    loadFilieres();
  };

  const mapLevelOptions = [
    { value: 'regions' as MapLevel, label: 'Régions', icon: MapPin },
    { value: 'departements' as MapLevel, label: 'Départements', icon: Layers },
    { value: 'communes' as MapLevel, label: 'Communes', icon: TrendingUp },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800" style={{ animation: 'slideRight 0.5s ease-out' }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-primary-50 to-white dark:from-gray-900 dark:to-gray-950">
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Filtres & Recherche
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Explorez les données agricoles du Cameroun
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'filters'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-gray-900'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'info'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-gray-900'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <MapPin className="w-4 h-4" />
          Informations
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
        {activeTab === 'filters' ? (
          <>
            {/* Barre de recherche */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search className="w-4 h-4" />
                Recherche rapide
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Rechercher une filière..."
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  style={{ animation: 'fadeIn 0.5s ease-in-out' }}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Niveau de carte */}
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('mapLevel')}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers className="w-4 h-4" />
                  Niveau de visualisation
                </span>
                {openSections.mapLevel ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              {openSections.mapLevel && (
                <div className="space-y-2 pl-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                  {mapLevelOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => onMapLevelChange(option.value)}
                        className={`w-full px-4 py-3 rounded-lg text-left transition-all transform hover:scale-105 ${
                          currentMapLevel === option.value
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium border-2 border-primary-500'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
                      >
                        <Icon className="w-5 h-5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filières */}
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('filieres')}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wheat className="w-4 h-4" />
                  Filières ({filieres.length})
                </span>
                {openSections.filieres ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              {openSections.filieres && (
                <div className="space-y-2" style={{ animation: 'slideDown 0.3s ease-out' }}>
                  {loading ? (
                    <SkeletonList count={3} />
                  ) : (
                    filieres.map((filiere) => (
                      <button
                        key={filiere.id}
                        onClick={() => setSelectedFiliere(filiere.id === selectedFiliere ? null : filiere.id)}
                        className={`w-full px-4 py-3 rounded-lg text-left transition-all transform hover:scale-105 ${
                          selectedFiliere === filiere.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium border-2 border-primary-500'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                        }`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: filiere.couleur || '#22c55e', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="font-medium truncate">{filiere.nom}</div>
                            {filiere.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {filiere.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Catégories */}
            {selectedFiliere && categories.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('categories')}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package className="w-4 h-4" />
                    Catégories ({categories.length})
                  </span>
                  {openSections.categories ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {openSections.categories && (
                  <div className="space-y-2 pl-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                    {categories.map((categorie) => (
                      <button
                        key={categorie.id}
                        onClick={() => setSelectedCategorie(categorie.id === selectedCategorie ? null : categorie.id)}
                        className={`w-full px-4 py-3 rounded-lg text-left transition-all transform hover:scale-105 ${
                          selectedCategorie === categorie.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium border-2 border-primary-500'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                        }`}
                      >
                        {categorie.nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Produits */}
            {produits.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('produits')}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package className="w-4 h-4" />
                    Produits ({produits.length})
                  </span>
                  {openSections.produits ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {openSections.produits && (
                  <div className="space-y-2 pl-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                    {produits.slice(0, 10).map((produit) => (
                      <button
                        key={produit.id}
                        onClick={() => setSelectedProduit(produit.id === selectedProduit ? null : produit.id)}
                        className={`w-full px-4 py-3 rounded-lg text-left transition-all transform hover:scale-105 ${
                          selectedProduit === produit.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium border-2 border-primary-500'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium">{produit.nom}</div>
                        {produit.unite_mesure && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Unité: {produit.unite_mesure}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Année */}
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('annee')}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar className="w-4 h-4" />
                  Année
                </span>
                {openSections.annee ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              {openSections.annee && annees.length > 0 && (
                <div className="pl-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                  <select
                    value={selectedAnnee || ''}
                    onChange={(e) => setSelectedAnnee(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="">Toutes les années</option>
                    {annees.map((annee) => (
                      <option key={annee} value={annee}>
                        {annee}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all transform hover:scale-105"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <X className="w-5 h-5" />
              Réinitialiser les filtres
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {selectedEntity ? (
              <div className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-800" style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">
                  {selectedEntity.nom || 'Information'}
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(selectedEntity).map(([key, value]) => {
                    if (key === 'id' || key === 'created_at' || key === 'updated_at' || !value) return null;
                    
                    return (
                      <div key={key} className="border-b border-gray-200 dark:border-gray-800 pb-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
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