import React from 'react';
import { GENRE_DECOR_ICONS } from '@/lib/genreIcons';

// Large, flat, low-opacity genre silhouette for the genre space hero's empty right side.
// Deliberately different treatment from the modal's glowing corner icon: no glow, no motion, pure silhouette.
export default function GenreHeroMark({ genreId, accent }) {
  const Icon = GENRE_DECOR_ICONS[genreId];
  if (!Icon) return null;

  return (
    <div
      className="absolute right-0 top-1/2 pointer-events-none select-none"
      style={{ transform: 'translateY(-50%)', zIndex: 0 }}
    >
      <Icon
        className="w-28 h-28 sm:w-44 sm:h-44 md:w-56 md:h-56"
        style={{ color: accent, opacity: 0.12 }}
        strokeWidth={1}
      />
    </div>
  );
}