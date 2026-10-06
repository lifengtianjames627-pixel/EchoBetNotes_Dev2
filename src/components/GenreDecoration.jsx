import React from 'react';
import { GENRE_DECOR_ICONS } from '@/lib/genreIcons';

// Subtle themed watermark icon shown in the corner of the review modal, per genre.
export default function GenreDecoration({ genreId, accent }) {
  const Icon = GENRE_DECOR_ICONS[genreId];
  if (!Icon) return null;

  return (
    <div className="absolute top-1 right-2 pointer-events-none" style={{ zIndex: 0 }}>
      <Icon
        style={{
          width: 88,
          height: 88,
          color: accent,
          opacity: 0.14,
          filter: `drop-shadow(0 0 18px ${accent})`,
        }}
        strokeWidth={1.2}
      />
    </div>
  );
}