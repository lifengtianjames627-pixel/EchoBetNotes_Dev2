import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star, MessageSquare, Youtube, Maximize2, Minimize2, Share2, Trash2 } from 'lucide-react';
import CivilityNotice from '@/components/CivilityNotice';
import BadgeIcon from '@/components/BadgeIcon';
import { displayName, publicName } from '@/shared/identity';
import TrackList from '@/components/TrackList';
import SingleCoverMatch from '@/components/SingleCoverMatch';
import ReviewActions from '@/components/ReviewActions';
import CommentSection from '@/components/CommentSection';
import ReviewShareCard from '@/components/ReviewShareCard';
import GenreDecoration from '@/components/GenreDecoration';
import VirtualItemModal from '@/components/VirtualItemModal';
import { Search } from 'lucide-react';
import { loadDraft, saveDraft, clearDraft } from '@/lib/reviewDraft';
import { useAuthed } from '@/shared/identity';
import { useContentModeration } from '@/shared/hooks/useContentModeration';
import CoverImage from '@/components/music/CoverImage';

function StarPicker({ rating, onRate, accent, muted }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onRate(n)}>
          <Star
            className="w-5 h-5 transition-all"
            style={{ color: n <= rating ? accent : muted, filter: n <= rating ? `drop-shadow(0 0 5px ${accent})` : 'none' }}
            fill={n <= rating ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}

const EMPTY_REVIEW_DATA = { rating: 0, title: '', content: '', band_style: '', band_background: '', band_history: '', band_story: '' };

function ReviewForm({ albumId, album, v, currentUser, onSuccess, allReviews }) {
  const draftScope = `album_${albumId}`;
  const [data, setData] = useState(() => loadDraft(draftScope) || EMPTY_REVIEW_DATA);
  const { moderate, status: moderationMsg, resetStatus: resetModeration } = useContentModeration();
  const queryClient = useQueryClient();

  useEffect(() => { saveDraft(draftScope, data); }, [data]);

  const createReview = useMutation({
    mutationFn: async (d) => {
      const textToCheck = [d.title, d.content, d.band_background, d.band_history, d.band_story].filter(Boolean).join('\n');
      const modResult = await moderate(textToCheck);

      const modStatus = modResult.suggestedAction === 'review' ? 'pending_review' : 'approved';

      await base44.entities.Review.create({
        album_id: albumId,
        album_title: album.title,
        album_artist: album.artist,
        album_cover_url: album.cover_url || '',
        rating: d.rating,
        title: d.title,
        content: d.content,
        reviewer_name: displayName(currentUser) || 'Anonymous',
        reviewer_email: currentUser?.email || '',
        reviewer_equipped_badges: currentUser?.equipped_badges || [],
        likes_count: 0,
        dislikes_count: 0,
        band_style: d.band_style,
        band_background: d.band_background,
        band_history: d.band_history,
        band_story: d.band_story,
        moderation_status: modStatus,
        moderation_categories: modResult.categories,
        moderation_reason: modResult.reason,
        moderation_confidence: modResult.confidence,
      });

      // Only update avg rating for approved reviews
      if (modStatus === 'approved') {
        await base44.functions.invoke('editReview', { action: 'syncRating', album_id: albumId });
      }

      return modStatus;
    },
    onSuccess: (modStatus) => {
      queryClient.invalidateQueries({ predicate: q => /album|review|homeFeed/.test(String(q.queryKey[0])) });
      setData(EMPTY_REVIEW_DATA);
      clearDraft(draftScope);
      if (modStatus === 'pending_review') {
        // 'pending' status is set by the moderation hook
      } else {
        onSuccess?.();
      }
    },
    onError: () => {
      // 'blocked' status is set by the moderation hook
    },
  });

  if (moderationMsg === 'blocked') {
    return (
      <div className="mt-4 rounded-xl p-5 text-center space-y-3" style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)' }}>
        <p className="text-2xl">🚫</p>
        <p className="text-sm font-semibold" style={{ color: '#ff6b6b' }}>Your content may not meet community guidelines.</p>
        <p className="text-xs" style={{ color: v.muted }}>Please revise your review and try again. Hate speech, harassment, and spam are not allowed.</p>
        <button onClick={resetModeration} className="text-xs px-4 py-1.5 rounded-full" style={{ border: `1px solid ${v.accent}40`, color: v.accent }}>Edit Review</button>
      </div>
    );
  }

  if (moderationMsg === 'pending') {
    return (
      <div className="mt-4 rounded-xl p-5 text-center space-y-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <p className="text-2xl">⏳</p>
        <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>Review submitted for approval</p>
        <p className="text-xs" style={{ color: v.muted }}>Your review is being checked by our team and will appear once approved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); createReview.mutate(data); }} className="space-y-3 mt-4 rounded-xl p-4" style={{ background: `${v.accent}0d`, border: `1px solid ${v.accent}25` }}>
      <p className="text-xs uppercase tracking-widest font-bold" style={{ color: v.muted }}>Write a Review</p>

      <CivilityNotice v={v} />

      <StarPicker rating={data.rating} onRate={r => setData({ ...data, rating: r })} accent={v.accent} muted={v.muted} />
      <input
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
        placeholder="Review title (optional)"
        value={data.title}
        onChange={e => setData({ ...data, title: e.target.value })}
      />
      <textarea
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
        rows={3}
        placeholder="Your honest take…"
        value={data.content}
        onChange={e => setData({ ...data, content: e.target.value })}
        required
      />

      {/* Band info section */}
      <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${v.accent}18` }}>
        <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: v.muted }}>Band / Artist Info <span className="normal-case font-normal opacity-60">(optional)</span></p>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: v.muted }}>Specific Style / Sub-genre</label>
            <input className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }} placeholder="e.g. Thrash Metal, Dream Pop, Bebop…" value={data.band_style} onChange={e => setData({ ...data, band_style: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: v.muted }}>Band Background</label>
            <textarea className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }} rows={2} placeholder="Who are they? Where are they from?" value={data.band_background} onChange={e => setData({ ...data, band_background: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: v.muted }}>Album Background</label>
            <textarea className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }} rows={2} placeholder="Context behind this album — concept, recording, inspiration…" value={data.band_story} onChange={e => setData({ ...data, band_story: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: v.muted }}>Band History</label>
            <textarea className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }} rows={2} placeholder="Formation, lineup changes, key milestones…" value={data.band_history} onChange={e => setData({ ...data, band_history: e.target.value })} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!data.rating || createReview.isPending}
        className="px-5 py-2 rounded-full text-sm font-semibold"
        style={{ background: v.accent, color: '#000', opacity: (!data.rating || createReview.isPending) ? 0.5 : 1, boxShadow: `0 0 14px ${v.accentGlow}` }}
      >
        {createReview.isPending ? 'Checking content…' : 'Post Review'}
      </button>
    </form>
  );
}

export default function MusicItemDetail({ item, v, onClose, onClickRegistered }) {
  const [showForm, setShowForm] = useState(false);
  const [localItem, setLocalItem] = useState(item);
  const [fullscreen, setFullscreen] = useState(false);
  const [shareReview, setShareReview] = useState(null); // review to share
  const [virtualTrack, setVirtualTrack] = useState(null); // track clicked inside an album
  const [findingAlbum, setFindingAlbum] = useState(false); // "find album" from a single

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { authed, login } = useAuthed();

  const canDelete = currentUser?.role === 'admin' && currentUser?.full_name?.trim().toLowerCase() === 'fengtian james li';

  const deleteAlbum = useMutation({
    mutationFn: () => base44.entities.Album.delete(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: q => /album|review|homeFeed/.test(String(q.queryKey[0])) });
      onClose();
    },
  });

  const { data: allReviewsRaw = [], isLoading } = useQuery({
    queryKey: ['item-reviews', item.id],
    queryFn: () => base44.entities.Review.filter({ album_id: item.id }, '-created_date', 100),
  });
  // Only show approved reviews publicly
  const reviews = allReviewsRaw.filter(r => !r.moderation_status || r.moderation_status === 'approved' || r.created_by_id === currentUser?.id);
  const ratedReviews = allReviewsRaw.filter(r => (!r.moderation_status || r.moderation_status === 'approved') && Number.isFinite(r.rating) && r.rating > 0);

  // Reviews store a snapshot of equipped badges at post time — fetch each reviewer's
  // CURRENT equipped badges live so unequipped badges disappear right away.
  const reviewerEmails = reviews.map(r => r.reviewer_email).filter(Boolean);
  const { data: liveBadges = {} } = useQuery({
    queryKey: ['live-equipped-badges', reviewerEmails.slice().sort().join(',')],
    queryFn: async () => (await base44.functions.invoke('getEquippedBadges', { emails: reviewerEmails })).data.badges,
    enabled: reviewerEmails.length > 0,
  });

  // Compute live avg from actual reviews (true mean)
  const avgRating = ratedReviews.length
    ? (ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length).toFixed(1)
    : null;

  return (
    <>
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className={fullscreen ? "w-full h-full overflow-y-auto" : "w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"}
        style={{ background: v.cardBg, border: fullscreen ? 'none' : `1px solid ${v.accent}30`, boxShadow: fullscreen ? 'none' : `0 0 60px ${v.accentGlow}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex gap-4 p-5 pb-4 sticky top-0 z-10 backdrop-blur-lg relative overflow-hidden" style={{ background: v.cardBg }}>
          <GenreDecoration genreId={localItem.genre} accent={v.accent} />
          <div className="w-20 h-20 rounded-xl shrink-0 overflow-hidden relative z-[1]" style={{ background: `${v.accent}15` }}>
            <CoverImage src={localItem.cover_url} alt={localItem.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 relative z-[1]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-widest" style={{ color: v.accent }}>{localItem.type || 'album'}</span>
                <h2 className="text-lg font-bold leading-tight mt-0.5" style={{ color: v.text, ...v.headerStyle }}>{localItem.title}</h2>
                <p className="text-sm" style={{ color: v.muted }}>{localItem.artist} {localItem.release_year && `· ${localItem.release_year}`}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {canDelete && (
                  <button
                    onClick={() => { if (window.confirm(`Delete "${localItem.title}"? This cannot be undone.`)) deleteAlbum.mutate(); }}
                    disabled={deleteAlbum.isPending}
                    style={{ color: '#f87171' }}
                    title="Delete album"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setFullscreen(f => !f)} style={{ color: v.muted }} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={onClose} style={{ color: v.muted }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {avgRating && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className="w-3.5 h-3.5" style={{ color: n <= Math.round(avgRating) ? v.accent : v.muted }} fill={n <= Math.round(avgRating) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <span className="text-sm font-bold" style={{ color: v.accent }}>{avgRating}</span>
                <span className="text-xs" style={{ color: v.muted }}>({ratedReviews.length})</span>
              </div>
            )}
          </div>
        </div>

        {localItem.description && (
          <p className="px-5 pb-2 text-sm leading-relaxed" style={{ color: v.muted }}>{localItem.description}</p>
        )}
        {localItem.tags?.length > 0 && (
          <div className="px-5 pb-4 flex flex-wrap gap-1.5">
            {localItem.tags.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: `${v.accent}18`, color: v.accent, border: `1px solid ${v.accent}30` }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Tracklist (albums only, auto-fetched) */}
        <TrackList
          item={localItem}
          v={v}
          onDataFetched={(update) => setLocalItem(prev => ({ ...prev, ...update }))}
          onTrackClick={(track) => setVirtualTrack(track)}
        />

        {/* Cover art match (singles only, auto-fetched with manual retry) */}
        {localItem.type === 'single' && (
          <SingleCoverMatch
            item={localItem}
            v={v}
            onDataFetched={(update) => setLocalItem(prev => ({ ...prev, ...update }))}
          />
        )}

        {/* MV link for singles only */}
        {localItem.type === 'single' && localItem.mv_url && (
          <div className="px-5 pb-4">
            <a
              href={localItem.mv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.35)', color: '#ff4444' }}
            >
              <Youtube className="w-4 h-4" />
              Watch Music Video
            </a>
          </div>
        )}

        {localItem.type === 'single' && (
          <div className="px-5 pb-4">
            <button
              onClick={() => setFindingAlbum(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ border: `1px solid ${v.accent}40`, color: v.accent }}
            >
              <Search className="w-3.5 h-3.5" /> Find Album
            </button>
          </div>
        )}

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: v.muted }}>
              Reviews {reviews.length > 0 && <span style={{ color: v.accent }}>({reviews.length})</span>}
            </p>
            {authed ? (
            <button
              onClick={() => setShowForm(f => !f)}
              className="text-xs px-3 py-1 rounded-full"
              style={{ border: `1px solid ${v.accent}40`, color: v.accent }}
            >
              {showForm ? 'Cancel' : '+ Review'}
            </button>
            ) : (
              <button onClick={login} className="text-xs px-3 py-1 rounded-full" style={{ border: `1px solid ${v.accent}40`, color: v.accent }}>
                Log in to review
              </button>
            )}
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <ReviewForm albumId={item.id} album={localItem} v={v} currentUser={currentUser} allReviews={reviews} onSuccess={() => setShowForm(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1,2].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: `${v.accent}10` }} />)}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4 mt-4">
              {reviews.map(review => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4"
                  style={{ background: `${v.accent}0a`, border: `1px solid ${v.cardBorder}` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <button
                        className="text-sm font-semibold hover:underline transition-all"
                        style={{ color: v.accent, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        onClick={() => {
                          if (currentUser?.email && review.reviewer_email && review.reviewer_email !== currentUser.email) {
                            window.dispatchEvent(new CustomEvent('openMiniChat', { detail: { email: review.reviewer_email, name: review.reviewer_name || '' } }));
                          }
                        }}
                        title={review.reviewer_email !== currentUser?.email ? 'Start a chat' : undefined}
                      >
                        {publicName(review.reviewer_name)}
                      </button>
                      {review.title && <span className="text-xs ml-2 italic" style={{ color: v.accent }}>"{review.title}"</span>}
                      {/* Equipped badges — live, not the stale post-time snapshot */}
                      {(liveBadges[review.reviewer_email]?.length > 0) && (
                        <div className="flex gap-1 mt-1">
                          {liveBadges[review.reviewer_email].map(id => (
                            <BadgeIcon key={id} badgeId={id} size="xs" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: v.muted }}>{review.content}</p>

                  {(review.band_style || review.band_background || review.band_history || review.band_story) && (
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${v.accent}15` }}>
                      {review.band_style && (
                        <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full" style={{ background: `${v.accent}20`, color: v.accent }}>
                          {review.band_style}
                        </span>
                      )}
                      {review.band_background && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: v.accent }}>Background</p>
                          <p className="text-xs leading-relaxed" style={{ color: v.muted }}>{review.band_background}</p>
                        </div>
                      )}
                      {review.band_history && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: v.accent }}>History</p>
                          <p className="text-xs leading-relaxed" style={{ color: v.muted }}>{review.band_history}</p>
                        </div>
                      )}
                      {review.band_story && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: v.accent }}>Story</p>
                          <p className="text-xs leading-relaxed" style={{ color: v.muted }}>{review.band_story}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <ReviewActions review={review} v={v} currentUser={currentUser} />
                    <button
                      onClick={() => setShareReview(review)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105"
                      style={{ background: 'rgba(167,139,250,0.12)', color: 'rgba(167,139,250,0.8)', border: '1px solid rgba(167,139,250,0.25)' }}
                    >
                      <Share2 className="w-3 h-3" />
                      分享卡片
                    </button>
                  </div>
                  <CommentSection reviewId={review.id} v={v} currentUser={currentUser} />
                </motion.div>
              ))}
            </div>
          ) : (
            !showForm && (
              <div className="text-center py-10" style={{ color: v.muted }}>
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reviews yet. Be the first!</p>
              </div>
            )
          )}
        </div>
      </motion.div>
    </motion.div>

    {/* Share card modal */}
    <AnimatePresence>
      {shareReview && (
        <ReviewShareCard
          review={shareReview}
          album={localItem}
          onClose={() => setShareReview(null)}
        />
      )}
    </AnimatePresence>

    {/* Track clicked inside an album — virtual single, only saved once reviewed */}
    <AnimatePresence>
      {virtualTrack && (
        <VirtualItemModal
          v={v}
          type="single"
          initialTitle={virtualTrack}
          initialArtist={localItem.artist}
          genre={localItem.genre}
          coverUrl={localItem.cover_url}
          currentUser={currentUser}
          onClose={() => setVirtualTrack(null)}
        />
      )}
    </AnimatePresence>

    {/* Find the parent album from a single — virtual album, only saved once reviewed */}
    <AnimatePresence>
      {findingAlbum && (
        <VirtualItemModal
          v={v}
          type="album"
          allowSearch
          initialArtist={localItem.artist}
          genre={localItem.genre}
          currentUser={currentUser}
          onClose={() => setFindingAlbum(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}