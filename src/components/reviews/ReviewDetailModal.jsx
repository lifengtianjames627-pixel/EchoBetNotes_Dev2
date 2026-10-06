import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReviewActions from '@/components/ReviewActions';
import CommentSection from '@/components/CommentSection';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';
import useCurrentReview from '@/shared/reviews/useCurrentReview';
import TranslateButton from '@/components/reviews/TranslateButton';
import boardCopy from '@/components/reviews/boardCopy';
import { useLang } from '@/i18n/LanguageContext';

const SECTIONS = [
  ['band_style', 'Style'],
  ['band_background', 'Band background'],
  ['band_story', 'Album background'],
  ['band_history', 'Band history'],
];

// Paper palette — the review-reading modal isn't in a genre context, so it
// uses the site-wide warm-paper tokens instead of a per-genre skin.
const V = {
  accent: '#bf7a35',
  muted: '#6b6358',
  accentGlow: 'rgba(191,122,53,0.25)',
  text: '#1a1815',
  cardBorder: '#e6ddc9',
};

// Full reading view for one review — full text, working like/dislike/subscribe,
// and a live comment thread. Same interactivity as the in-album review view.
export default function ReviewDetailModal({ review: seed, onClose }) {
  const review = useCurrentReview(seed);
  const [translated, setTranslated] = useState(null);
  const { lang } = useLang();
  const copy = boardCopy(lang);
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  if (!review) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,24,21,0.45)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
        className="w-full max-w-2xl max-h-[86vh] overflow-y-auto p-7"
        style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 16px 50px rgba(120,100,80,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-lg font-bold font-playfair" style={{ color: '#bf7a35' }}>
              {review.rating ? `${(review.rating * 2).toFixed(1)}/10` : '—'}
            </span>
            {review.title && (
              <h2 className="font-playfair italic text-2xl mt-1" style={{ color: '#1a1815' }}>"{review.title}"</h2>
            )}
          </div>
          <button onClick={onClose} style={{ color: '#6b6358' }}><X className="w-5 h-5" /></button>
        </div>

        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#3d3831' }}>
          {translated || review.content}
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <TranslateButton text={review.content} onResult={setTranslated} />
          {translated && <span className="text-[11px]" style={{ color: '#8a7e6f' }}>{copy.machine}</span>}
        </div>

        {SECTIONS.some(([k]) => review[k]) && (
          <div className="mt-6 pt-5 space-y-4" style={{ borderTop: '1px solid #e6ddc9' }}>
            {SECTIONS.filter(([k]) => review[k]).map(([k, label]) => (
              <div key={k}>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: '#bf7a35' }}>{label}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#5a534a' }}>{review[k]}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-7 pt-4 text-xs" style={{ borderTop: '1px solid #e6ddc9', color: '#8a7e6f' }}>
          <span className="flex items-center gap-1.5">
            <button
              onClick={() => openPrivateChat(review.reviewer_email, review.reviewer_name)}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
              title="Message this reviewer"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#e6ddc9' }}>
                <User className="w-3 h-3" style={{ color: '#6b6358' }} />
              </div>
              <span className="font-semibold hover:underline">{review.reviewer_name || 'Anonymous'}</span>
            </button>
            {review.created_date && <> · {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}</>}
          </span>
        </div>

        {/* Interactive like / dislike / subscribe */}
        <ReviewActions review={review} v={V} currentUser={currentUser} />

        {/* Comment thread */}
        <CommentSection reviewId={review.id} v={V} currentUser={currentUser} />
      </motion.div>
    </motion.div>
  );
}