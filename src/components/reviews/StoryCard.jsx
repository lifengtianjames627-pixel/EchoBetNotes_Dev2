import React from 'react';
import { motion } from 'framer-motion';
import { Compass, ListMusic } from 'lucide-react';
import { GENRES } from '@/lib/genreConfig';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import { publicName, initialOf } from '@/shared/identity';

// Card for the two non-album review kinds — a personal musical-journey essay
// (journey_story) and a curated "best albums in a genre" roundup
// (genre_roundup, Bandcamp-Daily style). Tap to open the full reading view.
export default function StoryCard({ review, onOpen }) {
  const { t } = useLang();
  const { localizedGenres } = useGenreText();
  const isRoundup = review.kind === 'genre_roundup';
  const genreLabel = review.genre
    ? (localizedGenres?.find(g => g.id === review.genre)?.label
      || GENRES.find(g => g.id === review.genre)?.label
      || review.genre)
    : '';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(review)}
      className="group text-left flex flex-col overflow-hidden rounded-xl transition-all hover:-translate-y-0.5"
      style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 2px 14px rgba(120,100,80,0.06)' }}
    >
      {/* Hero image, or a genre-tinted band when no image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden" style={{ background: '#e6ddc9' }}>
        {review.hero_image_url ? (
          <img src={review.hero_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f1ebdd 0%, #e6ddc9 100%)' }}>
            {isRoundup
              ? <ListMusic className="w-8 h-8 opacity-40" style={{ color: '#bf7a35' }} />
              : <Compass className="w-8 h-8 opacity-40" style={{ color: '#bf7a35' }} />}
          </div>
        )}
        <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(250,248,242,0.92)', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
          {isRoundup ? t('reviews.kind.roundup') : t('reviews.kind.journey')}
        </span>
        {genreLabel && (
          <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(191,122,53,0.92)', color: '#faf8f2' }}>
            {genreLabel}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-playfair text-lg italic leading-tight border-b border-transparent transition-colors group-hover:border-[#1a1815] inline-block self-start" style={{ color: '#1a1815' }}>
          {review.title || (isRoundup ? t('reviews.tab.roundups') : t('reviews.tab.stories'))}
        </h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed flex-1" style={{ color: '#6b6358' }}>
          {review.content}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: '#f1ebdd', color: '#8a5a20' }}>
            {initialOf(publicName({ full_name: review.reviewer_name, email: review.reviewer_email }))}
          </div>
          <span className="text-[11px] font-semibold truncate" style={{ color: '#5a534a' }}>
            {publicName({ full_name: review.reviewer_name, email: review.reviewer_email })}
          </span>
          {isRoundup && review.featured_albums?.length > 0 && (
            <span className="ml-auto text-[10px] shrink-0" style={{ color: '#bf7a35' }}>
              {review.featured_albums.length} albums
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}