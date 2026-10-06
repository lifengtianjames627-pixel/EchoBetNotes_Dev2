import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, ListMusic } from 'lucide-react';
import { GENRES } from '@/lib/genreConfig';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import { publicName, initialOf } from '@/shared/identity';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';
import CoverImage from '@/components/music/CoverImage';
import useCurrentReview from '@/shared/reviews/useCurrentReview';
import ReviewEditControl from '@/components/reviews/ReviewEditControl';

// Full reading view for a journey story or genre roundup — Bandcamp-Daily
// style: a hero, an editorial intro, and (for roundups) a stacked list of
// featured album picks each with cover art and a blurb.
export default function StoryDetailModal({ story: seed, onClose }) {
  const story = useCurrentReview(seed);
  const { t } = useLang();
  const { localizedGenres } = useGenreText();
  const isRoundup = story?.kind === 'genre_roundup';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  if (!story) return null;
  const genreLabel = story.genre
    ? (localizedGenres?.find(g => g.id === story.genre)?.label
      || GENRES.find(g => g.id === story.genre)?.label
      || story.genre)
    : '';
  const author = publicName({ full_name: story.reviewer_name, email: story.reviewer_email });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        style={{ background: 'rgba(26,24,21,0.55)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="relative w-full max-w-2xl my-4 rounded-2xl overflow-hidden"
          style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 10px 50px rgba(60,50,40,0.25)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Hero */}
          <div className="relative w-full aspect-[16/8] overflow-hidden" style={{ background: '#e6ddc9' }}>
            {story.hero_image_url ? (
              <img src={story.hero_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f1ebdd 0%, #e6ddc9 100%)' }}>
                {isRoundup ? <ListMusic className="w-12 h-12 opacity-40" style={{ color: '#bf7a35' }} /> : <Compass className="w-12 h-12 opacity-40" style={{ color: '#bf7a35' }} />}
              </div>
            )}
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(250,248,242,0.9)', color: '#5a534a' }}>
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4 flex gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(250,248,242,0.92)', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
                {isRoundup ? t('reviews.kind.roundup') : t('reviews.kind.journey')}
              </span>
              {genreLabel && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(191,122,53,0.92)', color: '#faf8f2' }}>{genreLabel}</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">
            <h2 className="font-playfair text-3xl italic leading-tight" style={{ color: '#1a1815' }}>{story.title}</h2>

            <button
              onClick={() => story.reviewer_email && openPrivateChat(story.reviewer_email, story.reviewer_name)}
              className="mt-3 flex items-center gap-2 text-left"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#f1ebdd', color: '#8a5a20' }}>
                {initialOf(author)}
              </div>
              <span className="text-xs font-semibold hover:underline" style={{ color: '#5a534a' }}>{author}</span>
            </button>

            <ReviewEditControl review={story} />
            <div className="mt-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#3a3530' }}>
              {story.content}
            </div>

            {/* Featured albums (roundup) */}
            {isRoundup && story.featured_albums?.length > 0 && (
              <div className="mt-8 space-y-5">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#bf7a35' }}>The picks</p>
                {story.featured_albums.map((a, i) => (
                  <div key={i} className="flex gap-4">
                    <CoverImage src={a.cover_url} alt={a.title || 'Album'} className="w-20 h-20 shrink-0 object-cover rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#bf7a35' }}>{a.artist}</p>
                      <h4 className="font-playfair text-lg italic leading-tight" style={{ color: '#1a1815' }}>{a.title}</h4>
                      {a.blurb && <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#6b6358' }}>{a.blurb}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}