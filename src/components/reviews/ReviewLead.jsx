import React from 'react';
import { ArrowRight } from 'lucide-react';
import CoverImage from '@/components/music/CoverImage';
import { useReviewerProfile } from '@/components/ReviewerProfileProvider';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';

// Featured review — horizontal paper card: square cover (no border / no radius /
// no zoom) + ochre tag + black serif title (hover underline) + summary.
export default function ReviewLead({ review, onOpen }) {
  const profile = useReviewerProfile(review?.reviewer_email);
  if (!review) return null;
  const reviewerName = profile?.name || review.reviewer_name || 'echoesbetweennotes listener';
  return (
    <button onClick={() => onOpen(review.album_id)} className="group flex flex-col sm:flex-row gap-6 text-left mb-10 pb-10 w-full" style={{ borderBottom: '1px solid #e6ddc9' }}>
      <div className="sm:w-56 shrink-0">
        <CoverImage src={review.album_cover_url} alt={review.album_title || 'Album artwork'} className="w-full aspect-square object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[10px] uppercase tracking-[0.24em] font-bold" style={{ color: '#bf7a35' }}>Editor's Pick</p>
        <h2 className="mt-2 font-playfair text-3xl italic leading-tight border-b border-transparent transition-colors group-hover:border-[#1a1815] inline-block self-start" style={{ color: '#1a1815' }}>
          {review.title || review.album_title}
        </h2>
        <p className="mt-2 text-sm" style={{ color: '#6b6358' }}>
          {review.album_artist} ·{' '}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); openPrivateChat(review.reviewer_email, reviewerName); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); openPrivateChat(review.reviewer_email, reviewerName); } }}
            className="font-semibold hover:underline cursor-pointer"
            style={{ color: '#1a1815' }}
          >
            {reviewerName}
          </span>
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed" style={{ color: '#5a534a' }}>{review.content}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#bf7a35' }}>
          Read the discussion <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}