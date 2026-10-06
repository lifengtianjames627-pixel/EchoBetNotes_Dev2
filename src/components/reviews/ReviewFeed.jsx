import React from 'react';
import { Link } from 'react-router-dom';
import CoverImage from '@/components/music/CoverImage';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import boardCopy from '@/components/reviews/boardCopy';

// Paper grid of review cards — square cover, ochre artist tag, black serif
// title, rating as a plain number. The genre chip below each card jumps into
// that genre's space.
export default function ReviewFeed({ reviews, onOpen, title, hint }) {
  const { lang } = useLang();
  const { gLabel } = useGenreText();
  const copy = boardCopy(lang);

  return (
    <section>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="font-playfair text-2xl italic" style={{ color: '#1a1815' }}>{title || copy.recent}</h2>
        <span className="text-xs" style={{ color: '#8a7e6f' }}>{hint || `${reviews.length}`}</span>
      </div>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map(review => (
          <div key={review.id} className="group">
            <button onClick={() => onOpen(review.album_id)} className="text-left w-full">
              <CoverImage src={review.album_cover_url} alt={review.album_title || 'Album artwork'} className="w-full aspect-square object-cover" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: '#bf7a35' }}>{review.album_artist}</p>
              <h3 className="mt-1 font-playfair text-lg italic leading-tight border-b border-transparent transition-colors group-hover:border-[#1a1815] inline-block" style={{ color: '#1a1815' }}>
                {review.title || review.album_title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: '#6b6358' }}>{review.content}</p>
              <p className="mt-2 text-[11px] font-semibold" style={{ color: '#bf7a35' }}>
                {review.rating ? `${(review.rating * 2).toFixed(1)}/10` : '—'} · {review.reviewer_name || 'Listener'}
              </p>
            </button>
            {review.genre && (
              <Link to={`/genre/${review.genre}`} className="mt-2 inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold hover:underline"
                style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
                {gLabel(review.genre, review.genre)}
              </Link>
            )}
          </div>
        ))}
      </div>
      {reviews.length === 0 && (
        <p className="py-16 text-center text-sm" style={{ color: '#8a7e6f' }}>{copy.empty}</p>
      )}
    </section>
  );
}