import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Star, Search } from 'lucide-react';
import { loadDraft, saveDraft, clearDraft } from '@/lib/reviewDraft';
import { displayName } from '@/lib/displayName';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReviewEditControl from '@/components/reviews/ReviewEditControl';
import { refreshMusic } from '@/shared/reviews/catalog';

// A "virtual" music item modal — used for tracks clicked inside an album (type='single')
// or an album searched for from a single (type='album'). The underlying Album/Single
// record is NOT created in the database until the user actually submits a review.
// Closing without reviewing leaves no trace.

function StarPicker({ rating, onRate, accent, muted }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onRate(n)}>
          <Star className="w-5 h-5" style={{ color: n <= rating ? accent : muted }} fill={n <= rating ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function VirtualItemModal({ v, initialTitle = '', initialArtist = '', genre, type, coverUrl, allowSearch, currentUser, onClose }) {
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);
  const [searched, setSearched] = useState(!allowSearch);
  const [checking, setChecking] = useState(false);
  const [matched, setMatched] = useState(null); // real Album entity, once found or created
  const queryClient = useQueryClient();
  const { data: reviews = [] } = useQuery({ queryKey: ['virtual-reviews', matched?.id], enabled: !!matched?.id,
    queryFn: async () => (await base44.entities.Review.filter({ album_id: matched.id }, '-created_date', 100)).filter(r => !r.moderation_status || r.moderation_status === 'approved' || r.created_by_id === currentUser?.id),
  });
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Draft scope only stable once title/artist are known (after search, or immediately if not allowSearch)
  const draftScope = searched ? `${type}_${title.toLowerCase()}_${artist.toLowerCase()}` : null;

  useEffect(() => {
    if (!draftScope) return;
    const draft = loadDraft(draftScope);
    if (draft) {
      setRating(draft.rating || 0);
      setContent(draft.content || '');
      setShowForm(true);
    }
  }, [draftScope]);

  useEffect(() => {
    if (!draftScope || (!rating && !content)) return;
    saveDraft(draftScope, { rating, content });
  }, [draftScope, rating, content]);

  const checkMatch = async () => {
    setChecking(true);
    let found = null;
    try {
      const exact = await base44.entities.Album.filter({ type, title, artist });
      found = exact[0] || null;
      if (!found) {
        const sameType = await base44.entities.Album.filter({ type }, '-created_date', 200);
        found = sameType.find(a => a.title?.toLowerCase() === title.toLowerCase() && a.artist?.toLowerCase() === artist.toLowerCase()) || null;
      }
    } catch { /* ignore */ }
    setMatched(found);

    setChecking(false);
    setSearched(true);
  };

  useEffect(() => {
    if (!allowSearch) checkMatch();
  }, []);

  const handleSubmit = async () => {
    if (!rating || !content.trim() || submitting) return;
    setSubmitting(true);
    setBlocked(false);

    let modResult = { suggestedAction: 'allow', categories: [], reason: '', confidence: 0 };
    try {
      const res = await base44.functions.invoke('moderateContent', { text: content });
      modResult = res.data;
    } catch { /* allow on failure */ }

    if (modResult.suggestedAction === 'block') {
      setBlocked(true);
      setSubmitting(false);
      return;
    }

    let album = matched;
    if (!album) {
      album = await base44.entities.Album.create({
        title, artist, type, genre, cover_url: coverUrl || '', review_count: 0, avg_rating: 0,
      });
      setMatched(album);
    }

    const modStatus = modResult.suggestedAction === 'review' ? 'pending_review' : 'approved';
    const newReview = await base44.entities.Review.create({
      album_id: album.id,
      album_title: title,
      album_artist: artist,
      album_cover_url: coverUrl || '',
      rating,
      content,
      reviewer_name: displayName(currentUser) || 'Anonymous',
      reviewer_email: currentUser?.email || '',
      reviewer_equipped_badges: currentUser?.equipped_badges || [],
      likes_count: 0,
      dislikes_count: 0,
      moderation_status: modStatus,
      moderation_categories: modResult.categories,
      moderation_reason: modResult.reason,
      moderation_confidence: modResult.confidence,
    });

    if (modStatus === 'approved') {
      await base44.functions.invoke('editReview', { action: 'syncRating', album_id: album.id });
    }
    refreshMusic(queryClient);
    setRating(0);
    setContent('');
    setShowForm(false);
    setSubmitting(false);
    if (draftScope) clearDraft(draftScope);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: v.cardBg, border: `1px solid ${v.accent}30` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-3 p-5 pb-3 items-start">
          {(matched?.cover_url || coverUrl) && (
            <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden" style={{ background: `${v.accent}15` }}>
              <img src={matched?.cover_url || coverUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs uppercase tracking-widest" style={{ color: v.accent }}>{type}</span>
            {allowSearch && !searched ? (
              <div className="mt-2 space-y-2">
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
                  placeholder="Album title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
                  placeholder="Artist"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                />
                <button
                  disabled={!title.trim() || !artist.trim() || checking}
                  onClick={checkMatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: v.accent, color: '#000', opacity: checking ? 0.6 : 1 }}
                >
                  <Search className="w-3.5 h-3.5" /> {checking ? 'Searching…' : 'Search'}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold leading-tight mt-0.5" style={{ color: v.text }}>{title}</h2>
                <p className="text-sm" style={{ color: v.muted }}>{artist}</p>
              </>
            )}
          </div>
          <button onClick={onClose} style={{ color: v.muted }}><X className="w-5 h-5" /></button>
        </div>

        {searched && (
          <div className="px-5 pb-6">
            {checking ? (
              <p className="text-xs" style={{ color: v.muted }}>Searching…</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest font-bold" style={{ color: v.muted }}>
                    Reviews {reviews.length > 0 && <span style={{ color: v.accent }}>({reviews.length})</span>}
                  </p>
                  <button
                    onClick={() => setShowForm(f => !f)}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ border: `1px solid ${v.accent}40`, color: v.accent }}
                  >
                    {showForm ? 'Cancel' : '+ Review'}
                  </button>
                </div>

                <AnimatePresence>
                  {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      {blocked ? (
                        <div className="rounded-xl p-4 text-center space-y-2" style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)' }}>
                          <p className="text-xs font-semibold" style={{ color: '#ff6b6b' }}>Your content may not meet community guidelines.</p>
                          <button onClick={() => setBlocked(false)} className="text-xs px-3 py-1 rounded-full" style={{ border: `1px solid ${v.accent}40`, color: v.accent }}>Edit</button>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-xl p-4 mb-4" style={{ background: `${v.accent}0d`, border: `1px solid ${v.accent}25` }}>
                          <StarPicker rating={rating} onRate={setRating} accent={v.accent} muted={v.muted} />
                          <textarea
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
                            rows={3}
                            placeholder="Your honest take…"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                          />
                          <button
                            disabled={!rating || !content.trim() || submitting}
                            onClick={handleSubmit}
                            className="px-4 py-1.5 rounded-full text-sm font-semibold"
                            style={{ background: v.accent, color: '#000', opacity: (!rating || !content.trim() || submitting) ? 0.5 : 1 }}
                          >
                            {submitting ? 'Posting…' : 'Post Review'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map(r => (
                      <div key={r.id} className="rounded-xl p-3" style={{ background: `${v.accent}0a`, border: `1px solid ${v.cardBorder}` }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {[1,2,3,4,5].map(n => <Star key={n} className="w-3 h-3" style={{ color: n <= r.rating ? v.accent : v.muted }} fill={n <= r.rating ? 'currentColor' : 'none'} />)}
                          <span className="text-xs font-semibold ml-1" style={{ color: v.accent }}>{r.reviewer_name || 'Anonymous'}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: v.muted }}>{r.content}</p>
                        <ReviewEditControl review={r} />
                      </div>
                    ))}
                  </div>
                ) : (
                  !showForm && <p className="text-sm py-6 text-center" style={{ color: v.muted }}>No reviews yet. Be the first!</p>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}