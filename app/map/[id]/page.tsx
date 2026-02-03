'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Leaf, MapPin, Package, Wheat, TrendingUp,
  Users, BarChart2, Layers, AlertCircle, ExternalLink,
  Building2, Factory, Store, TrendingDown, Calendar,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import type { MapLevel } from '@/types/api';
import {
  getRegion, getDepartement, getCommune,
  getRegionProductions, getDepartementProductions, getCommuneProductions,
  getRegionDepartements, getDepartementCommunes, getCommuneInfrastructures,
  getRegionsGeoJSON, getDepartementsGeoJSON, getCommunesGeoJSON,
  getFilieres, getCategories, getProduits,
} from '@/lib/api';

const DetailMap = dynamic(() => import('@/components/DetailMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center rounded-xl">
      <div className="inline-block w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function DetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') || 'regions') as MapLevel;

  const [entity, setEntity] = useState<any>(null);
  const [productions, setProductions] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [infrastructures, setInfrastructures] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.log(`📄 [DetailPage] Loading detail for id=${id} level=${level}`);
      setLoading(true);
      setError(null);

      try {
        let ent: any, prods: any[], kids: any[], infras: any[], geo: any;
        let fils: any, cats: any, prts: any;

        // Charger les données de base
        const [filieresData, categoriesData, produitsData] = await Promise.all([
          getFilieres(0, 100),
          getCategories(0, 100),
          getProduits(0, 100),
        ]);

        fils = filieresData.items;
        cats = categoriesData.items;
        prts = produitsData.items;

        switch (level) {
          case 'regions': {
            [ent, prods, kids, geo] = await Promise.all([
              getRegion(id),
              getRegionProductions(id),
              getRegionDepartements(id),
              getRegionsGeoJSON(),
            ]);
            infras = [];
            break;
          }
          case 'departements': {
            [ent, prods, kids, geo] = await Promise.all([
              getDepartement(id),
              getDepartementProductions(id),
              getDepartementCommunes(id),
              getDepartementsGeoJSON(),
            ]);
            infras = [];
            break;
          }
          case 'communes': {
            [ent, prods, infras, geo] = await Promise.all([
              getCommune(id),
              getCommuneProductions(id),
              getCommuneInfrastructures(id),
              getCommunesGeoJSON(),
            ]);
            kids = [];
            break;
          }
          default:
            throw new Error('Level inconnu');
        }

        if (cancelled) return;

        setEntity(ent);
        setProductions(Array.isArray(prods) ? prods : (prods?.items || []));
        setChildren(Array.isArray(kids) ? kids : (kids?.items || []));
        setInfrastructures(Array.isArray(infras) ? infras : (infras?.items || []));
        setFilieres(fils);
        setCategories(cats);
        setProduits(prts);
        setGeoData(geo);

        console.log(`✅ [DetailPage] All data loaded for ${ent?.nom}`);
      } catch (e: any) {
        if (!cancelled) {
          console.error('❌ [DetailPage] fetch error', e);
          setError(e.message || 'Erreur de chargement');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, level]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat('fr-FR').format(n) : '—';
  const fmtFCFA = (n: number | null | undefined) =>
    n != null ? `${new Intl.NumberFormat('fr-FR').format(n)} FCFA` : '—';

  const totalQuantite = productions.reduce((s, p) => s + (p.quantite || 0), 0);
  const totalValeur = productions.reduce((s, p) => s + (p.valeur_fcfa || 0), 0);
  const totalProducteurs = productions.reduce((s, p) => s + (p.nombre_producteurs || 0), 0);
  const totalSuperficie = productions.reduce((s, p) => s + (p.superficie_ha || 0), 0);

  const childLabel = level === 'regions' ? 'Départements' : level === 'departements' ? 'Communes' : '';
  
  const infraIconMap: Record<string, string> = {
    marché: '🏪',
    entrepôt: '🏭',
    coopérative: '🤝',
    usine_transformation: '⚙️',
    point_collecte: '📦',
  };

  // Grouper productions par filière
  const productionsByFiliere = productions.reduce((acc: any, prod: any) => {
    const produit = produits.find(p => p.id === prod.produit_id);
    if (!produit) return acc;
    
    const categorie = categories.find(c => c.id === produit.categorie_id);
    if (!categorie) return acc;
    
    const filiere = filieres.find(f => f.id === categorie.filiere_id);
    if (!filiere) return acc;

    const key = filiere.nom;
    if (!acc[key]) {
      acc[key] = { filiere, total: 0, count: 0 };
    }
    acc[key].total += prod.quantite || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erreur</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/map" className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all">
            <ArrowLeft className="w-4 h-4" /> Retour à la carte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/map" className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {loading ? '…' : entity?.nom}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 capitalize">
                  ({level.slice(0, -1)})
                </span>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {loading ? (
        /* Skeleton */
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {/* Carte hero */}
          <div className="anim-fadeIn rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800" style={{ height: '400px' }}>
            <DetailMap geoData={geoData} targetId={id} />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Population', value: fmt(entity?.population), icon: Users, color: 'from-blue-400 to-blue-600', delay: 'delay-50' },
              { label: 'Superficie', value: entity?.superficie_km2 ? `${fmt(entity.superficie_km2)} km²` : '—', icon: Layers, color: 'from-emerald-400 to-emerald-600', delay: 'delay-100' },
              { label: 'Productions', value: fmt(productions.length), icon: Wheat, color: 'from-green-400 to-green-600', delay: 'delay-150' },
              { label: 'Valeur totale', value: fmtFCFA(totalValeur), icon: TrendingUp, color: 'from-purple-400 to-purple-600', delay: 'delay-200' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className={`anim-slideUp ${kpi.delay} bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold text-gray-900 dark:text-white truncate">{kpi.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Productions par filière */}
          {Object.keys(productionsByFiliere).length > 0 && (
            <div className="anim-slideUp delay-250 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-green-500" /> Productions par filière
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(productionsByFiliere).map(([nom, data]: [string, any], i) => (
                  <div key={i} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: data.filiere.couleur || '#22c55e' }}>
                        {data.filiere.icone || '🌾'}
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">{nom}</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(data.total)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{data.count} production{data.count > 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entity info */}
          <div className="anim-slideUp delay-300 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" /> Informations générales
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              {entity && Object.entries(entity).map(([k, v]) => {
                if (['id', 'created_at', 'updated_at'].includes(k) || v == null) return null;
                return (
                  <div key={k} className="flex flex-col">
                    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{k.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Children & Infrastructures */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            {childLabel && (
              <div className="anim-slideUp delay-350 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-500" /> {childLabel} <span className="text-green-500">({children.length})</span>
                </h3>
                {children.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">Aucune donnée</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                    {children.map((c: any, i: number) => (
                      <div key={c.id || i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.nom}</span>
                        {c.population && <span className="text-xs text-gray-400 dark:text-gray-500">{fmt(c.population)} hab.</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="anim-slideUp delay-400 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" /> Infrastructures <span className="text-green-500">({infrastructures.length})</span>
              </h3>
              {infrastructures.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Aucune infrastructure</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                  {infrastructures.map((inf: any, i: number) => (
                    <div key={inf.id || i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-lg">{infraIconMap[inf.type_infrastructure] || '🏗️'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{inf.nom}</p>
                        {inf.type_infrastructure && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                            {inf.type_infrastructure.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Productions table */}
          {productions.length > 0 && (
            <div className="anim-slideUp delay-450 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-green-500" /> Productions détaillées <span className="text-green-500">({productions.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Année</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quantité</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Valeur</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Producteurs</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Superficie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productions.slice(0, 20).map((p: any, i: number) => (
                      <tr key={p.id || i} className="border-t border-gray-100 dark:border-gray-800 hover:bg-green-50/40 dark:hover:bg-green-900/20 transition-colors">
                        <td className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">{p.annee}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{fmt(p.quantite)}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{fmtFCFA(p.valeur_fcfa)}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{fmt(p.nombre_producteurs)}</td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-500">{p.superficie_ha ? `${fmt(p.superficie_ha)} ha` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Producteurs summary */}
          {totalProducteurs > 0 && (
            <div className="anim-slideUp delay-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-display font-extrabold text-gray-900 dark:text-white">{fmt(totalProducteurs)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Producteurs répertoriés</p>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}