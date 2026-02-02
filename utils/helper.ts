// Utilitaires pour l'application

/**
 * Formate un nombre avec séparateurs de milliers
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

/**
 * Formate une valeur monétaire en FCFA
 */
export const formatCurrency = (value: number): string => {
  return `${formatNumber(value)} FCFA`;
};

/**
 * Formate une superficie en hectares ou km²
 */
export const formatSuperficie = (value: number, unit: 'ha' | 'km2' = 'ha'): string => {
  return `${formatNumber(value)} ${unit === 'ha' ? 'ha' : 'km²'}`;
};

/**
 * Tronque un texte avec ellipse
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Génère une couleur aléatoire pour les visualisations
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Détermine la couleur en fonction d'une valeur
 */
export const getColorByValue = (value: number, max: number): string => {
  const percentage = (value / max) * 100;
  
  if (percentage >= 75) return '#22c55e'; // vert foncé
  if (percentage >= 50) return '#86efac'; // vert clair
  if (percentage >= 25) return '#fbbf24'; // jaune
  return '#f87171'; // rouge
};

/**
 * Calcule le pourcentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Formate une date
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Génère un ID unique
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce une fonction
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Classe CSS conditionnelle
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Vérifie si une valeur est vide
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Extrait les coordonnées d'un objet GeoJSON
 */
export const extractCoordinates = (geometry: any): [number, number] | null => {
  if (!geometry || !geometry.coordinates) return null;
  
  try {
    if (geometry.type === 'Point') {
      return [geometry.coordinates[1], geometry.coordinates[0]];
    }
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0][0];
      return [coords[1], coords[0]];
    }
    if (geometry.type === 'MultiPolygon') {
      const coords = geometry.coordinates[0][0][0];
      return [coords[1], coords[0]];
    }
  } catch (error) {
    console.error('Erreur lors de l\'extraction des coordonnées:', error);
  }
  
  return null;
};

/**
 * Calcule le centre d'un polygon
 */
export const calculateCenter = (coordinates: number[][][]): [number, number] => {
  let totalLat = 0;
  let totalLng = 0;
  let count = 0;
  
  coordinates[0].forEach(([lng, lat]) => {
    totalLat += lat;
    totalLng += lng;
    count++;
  });
  
  return [totalLat / count, totalLng / count];
};

/**
 * Trie un tableau d'objets par propriété
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Groupe un tableau par propriété
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Convertit une chaîne en slug
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Copie du texte dans le presse-papiers
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    return false;
  }
};

/**
 * Télécharge un fichier JSON
 */
export const downloadJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Télécharge un fichier CSV
 */
export const downloadCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};