import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, User, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CoverImage from '@/components/music/CoverImage';
import { useReviewerProfile } from '@/components/ReviewerProfileProvider';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';
import ReviewEditControl from '@/components/reviews/ReviewEditControl';
import TranslateButton from '@/components/reviews/TranslateButton';
import boardCopy from '@/components/reviews/boardCopy';
import { useLang } from '@/i18n/LanguageContext';
import editCopy from '@/components/reviews/editCopy';

// Paper review card — cream bg, thin warm border, near-black ink, ochre rating
// number (no star component). Long reviews are clipped with a Read more toggle
// so the full text can always be read in place.
export default function ReviewCard({ review, showAlbum = true }) {
  const [expanded, setExpanded] = useState(false);
  const [translated, setTranslated] = useState(null);
  const { lang } = useLang();
  const copy = boardCopy(lang);
  const canLinkAlbum = showAlbum && !review.album_missing && !!review.album_id && (!review.kind || review.kind === 'album_review');
  const isLong = (review.content || '').length > 220;
  const profile = useReviewerProfile(review.reviewer_email);
  const reviewerName = profile?.name || review.reviewer_name || 'Anonymous';

  return (
    <div className="p-5 transition-colors" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
      <div className="flex gap-4">
        {canLinkAlbum && (
          <Link to={`/album/${review.album_id}`} className="shrink-0">
            <div className="w-16 h-16 overflow-hidden" style={{ background: '#e6ddc9' }}>
              <CoverImage src={review.album_cover_url} alt={review.album_title || 'Album artwork'} className="w-full h-full object-cover" />
            </div>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {canLinkAlbum && (
                <Link to={`/album/${review.album_id}`} className="text-sm font-semibold transition-colors hover:underline" style={{ color: '#1a1815' }}>
                  {review.album_title} — {review.album_artist}
                </Link>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold" style={{ color: '#bf7a35' }}>{review.rating ? `${(review.rating * 2).toFixed(1)}/10` : '—'}</span>
                {review.title && <span className="text-sm font-medium" style={{ color: '#1a1815' }}>"{review.title}"</span>}
              </div>
            </div>
          </div>
          <p
            className={`text-sm mt-2 whitespace-pre-wrap ${expanded || !isLong ? '' : 'line-clamp-3'}`}
            style={{ color: '#5a534a' }}
          >
            {translated || review.content}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <TranslateButton text={review.content} onResult={setTranslated} />
            {translated && <span className="text-[11px]" style={{ color: '#8a7e6f' }}>{copy.machine}</span>}
          </div>
          {isLong && !expanded && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setExpanded(true); } }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline cursor-pointer"
              style={{ color: '#bf7a35' }}
            >
              Read full review <ChevronDown className="w-3 h-3" />
            </span>
          )}
          {review.album_missing && <p className="mt-2 text-xs text-muted-foreground">{review.album_title} · {editCopy(lang).missing}</p>}
          <ReviewEditControl review={review} />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8a7e6f' }}>
              <button
                onClick={() => openPrivateChat(review.reviewer_email, reviewerName)}
                className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                title="Message this reviewer"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: '#e6ddc9' }}>
                  {profile?.picture_url
                    ? <img src={profile.picture_url} alt="" className="w-full h-full object-cover" />
                    : <User className="w-3 h-3" style={{ color: '#6b6358' }} />}
                </div>
                <span className="font-semibold hover:underline">{reviewerName}</span>
              </button>
              {review.created_date && (
                <>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#8a7e6f' }}>
              <Heart className="w-3.5 h-3.5" />
              <span>{review.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}