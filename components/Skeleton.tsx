'use client';

import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3 animate-shimmer"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-shimmer"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-shimmer"></div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonMap = () => (
  <div className="w-full h-full bg-gray-100 dark:bg-gray-900 animate-pulse flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement de la carte...</p>
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-shimmer"></div>
      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-shimmer"></div>
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-2 animate-shimmer"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-shimmer"></div>
  </div>
);