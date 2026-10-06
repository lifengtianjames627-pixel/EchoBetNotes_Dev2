import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, PenLine, Headphones, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CoverImage from '@/components/music/CoverImage';
import FeedQueryState from '@/components/reviews/FeedQueryState';

// Compact review tile for the home feed. When a personal AI reason exists it
// replaces the review excerpt so the "For You" card reads as a recommendation.
function ReviewTile({ review, reason }) {
  return (
    <Link to={`/album/${review.album_id}`} className="group block p-4 transition-colors hover:bg-[#f5f0e3]" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
      <div className="flex gap-3">
        <div className="w-14 h-14 shrink-0 overflow-hidden" style={{ background: '#e6ddc9' }}>
          <CoverImage src={review.album_cover_url} alt={review.album_title || 'Album'} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate transition-colors group-hover:underline" style={{ color: '#1a1815' }}>
            {review.album_title} — {review.album_artist}
          </p>
          <p className="text-xs font-bold mt-0.5" style={{ color: '#bf7a35' }}>
            {review.rating ? `${(review.rating * 2).toFixed(1)}/10` : '—'}
          </p>
          {reason ? (
            <p className="text-xs mt-1.5 italic leading-relaxed line-clamp-2" style={{ color: '#6b6358' }}>{reason}</p>
          ) : (
            review.content && <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: '#6b6358' }}>{review.content}</p>
          )}
          <p className="text-[11px] mt-1.5" style={{ color: '#8a7e6f' }}>{review.reviewer_name || 'Anonymous'}</p>
        </div>
      </div>
    </Link>
  );
}

function PodcastTile({ pod }) {
  return (
    <Link to="/podcasts" className="group block p-4 transition-colors hover:bg-[#f5f0e3]" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
      <div className="flex gap-3">
        <div className="w-14 h-14 shrink-0 overflow-hidden flex items-center justify-center" style={{ background: '#e6ddc9' }}>
          {pod.cover_url ? (
            <img src={pod.cover_url} alt={pod.title} className="w-full h-full object-cover" />
          ) : (
            <Headphones className="w-5 h-5" style={{ color: '#8a7e6f' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate transition-colors group-hover:underline" style={{ color: '#1a1815' }}>{pod.title}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#6b6358' }}>{pod.host_name}</p>
          {pod.description && <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: '#8a7e6f' }}>{pod.description}</p>}
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ icon: Icon, title, to }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: '#bf7a35' }} />
        <h2 className="font-playfair italic text-xl" style={{ color: '#1a1815' }}>{title}</h2>
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: '#bf7a35' }}>
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function HomeFeed() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: () => base44.functions.invoke('homeFeed', {}).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-6 w-48 rounded mb-6 animate-pulse" style={{ background: '#e6ddc9' }} />
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded animate-pulse" style={{ background: '#e6ddc9' }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <FeedQueryState retry={refetch} />;

  const { recentReviews = [], recentPodcasts = [], forYou = [], aiBlurb, tasteLabels, hasTaste, isLoggedIn } = data || {};
  const showForYou = isLoggedIn && hasTaste && forYou.length > 0;

  if (recentReviews.length === 0 && recentPodcasts.length === 0 && !showForYou) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {showForYou && (
        <section className="mb-12">
          <SectionHeader icon={Sparkles} title="For You" />
          {tasteLabels && (
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: '#bf7a35' }}>
              Because you listen to {tasteLabels}
            </p>
          )}
          {aiBlurb && (
            <p className="text-sm italic mb-4 leading-relaxed" style={{ color: '#6b6358' }}>
              {aiBlurb}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {forYou.map(r => <ReviewTile key={r.id} review={r} reason={r._reason} />)}
          </div>
        </section>
      )}

      {recentReviews.length > 0 && (
        <section className="mb-12">
          <SectionHeader icon={PenLine} title="New Reviews" to="/reviews" />
          <div className="grid sm:grid-cols-2 gap-4">
            {recentReviews.map(r => <ReviewTile key={r.id} review={r} />)}
          </div>
        </section>
      )}

      {recentPodcasts.length > 0 && (
        <section>
          <SectionHeader icon={Headphones} title="Fresh Podcasts" to="/podcasts" />
          <div className="grid sm:grid-cols-2 gap-4">
            {recentPodcasts.map(p => <PodcastTile key={p.id} pod={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}