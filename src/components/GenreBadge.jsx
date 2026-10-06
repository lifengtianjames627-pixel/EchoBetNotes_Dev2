import React from 'react';
import { Badge } from '@/components/ui/badge';

const genreLabels = {
  rock: 'Rock', pop: 'Pop', hip_hop: 'Hip Hop', r_and_b: 'R&B',
  jazz: 'Jazz', classical: 'Classical', electronic: 'Electronic',
  indie: 'Indie', metal: 'Metal', punk: 'Punk', folk: 'Folk',
  country: 'Country', latin: 'Latin', k_pop: 'K-Pop', other: 'Other'
};

const genreColors = {
  rock: 'bg-red-100 text-red-700 border-red-200',
  pop: 'bg-pink-100 text-pink-700 border-pink-200',
  hip_hop: 'bg-amber-100 text-amber-700 border-amber-200',
  r_and_b: 'bg-purple-100 text-purple-700 border-purple-200',
  jazz: 'bg-blue-100 text-blue-700 border-blue-200',
  classical: 'bg-slate-100 text-slate-700 border-slate-200',
  electronic: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  indie: 'bg-orange-100 text-orange-700 border-orange-200',
  metal: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  punk: 'bg-lime-100 text-lime-700 border-lime-200',
  folk: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  country: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  latin: 'bg-rose-100 text-rose-700 border-rose-200',
  k_pop: 'bg-violet-100 text-violet-700 border-violet-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function GenreBadge({ genre, className = '' }) {
  return (
    <Badge 
      variant="outline" 
      className={`${genreColors[genre] || genreColors.other} text-xs font-medium ${className}`}
    >
      {genreLabels[genre] || genre}
    </Badge>
  );
}

export { genreLabels };