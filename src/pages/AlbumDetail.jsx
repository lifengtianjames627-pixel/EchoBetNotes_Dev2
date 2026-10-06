import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StarRating from '@/components/StarRating';
import GenreBadge from '@/components/GenreBadge';
import ReviewCard from '@/components/ReviewCard';
import { ArrowLeft, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewDetailModal from '@/components/reviews/ReviewDetailModal';
import { useAuthed } from '@/hooks/useAuthed';
import CoverImage from '@/components/music/CoverImage';
import { trackGenre } from '@/lib/trackGenre';
import { useContentModeration } from '@/shared/hooks/useContentModeration';
import usePublishAlbumReview from '@/features/reviews/queries/usePublishAlbumReview';
import PublishFeedback from '@/features/reviews/components/PublishFeedback';
import useAlbumReviewData from '@/features/reviews/queries/useAlbumReviewData';

export default function AlbumDetail() {
  const { id } = useParams();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, title: '', content: '' });
  const [openReview, setOpenReview] = useState(null);
  const { authed, login } = useAuthed();
  const { moderate } = useContentModeration();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
  const { album, loadingAlbum, reviews } = useAlbumReviewData(id, currentUser);

  // Preserve taste tracking when the current album's genre changes.
  useEffect(() => {
    if (album?.genre) trackGenre(album.genre);
  }, [album?.genre, id]);
  const createReview = usePublishAlbumReview({
    album, user: currentUser, moderate,
    onSuccess: () => {
      setShowReviewForm(false);
      setReviewData({ rating: 0, title: '', content: '' });
    },
  });

  if (loadingAlbum) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#e6ddc9] border-t-[#bf7a35] rounded-full animate-spin" /></div>;
  }

  if (!album) {
    return <div className="text-center py-20" style={{ color: '#8a7e6f' }}>Album not found.</div>;
  }

  return (
    <div className="min-h-screen py-10" style={{ background: '#f3efe6' }}>
      <div className="mx-auto max-w-3xl px-6">
        <Link to="/reviews" className="inline-flex items-center gap-2 text-sm transition-colors hover:underline" style={{ color: '#6b6358' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Reviews
        </Link>

        {/* Album header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-8 mt-6">
          <div className="w-full sm:w-56 shrink-0">
            <div className="aspect-square overflow-hidden" style={{ background: '#e6ddc9' }}>
              <CoverImage src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {album.genre && (
                <Link to={`/genre/${album.genre}`} title="Open this genre's space" className="transition-opacity hover:opacity-75">
                  <GenreBadge genre={album.genre} />
                </Link>
              )}
              {album.release_year && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#8a7e6f' }}>
                  <Calendar className="w-3 h-3" /> {album.release_year}
                </span>
              )}
            </div>
            <h1 className="font-playfair text-3xl md:text-4xl italic mt-3" style={{ color: '#1a1815' }}>{album.title}</h1>
            <p className="text-lg mt-1" style={{ color: '#6b6358' }}>{album.artist}</p>

            <div className="flex items-center gap-4 mt-5">
              <span className="font-playfair text-2xl font-bold" style={{ color: '#bf7a35' }}>
                {album.avg_rating ? (album.avg_rating * 2).toFixed(1) : '—'}
                <span className="text-sm font-normal" style={{ color: '#8a7e6f' }}> / 10</span>
              </span>
              <span className="flex items-center gap-1 text-sm" style={{ color: '#8a7e6f' }}>
                <MessageSquare className="w-4 h-4" /> {album.review_count || 0} reviews
              </span>
            </div>

            {album.description && (
              <p className="mt-4 text-sm leading-relaxed" style={{ color: '#5a534a' }}>{album.description}</p>
            )}

            {authed ? (
              <Button onClick={() => setShowReviewForm(!showReviewForm)} className="mt-6 rounded-none gap-2" style={{ background: '#1a1815', color: '#faf8f2' }}>
                Write a Review
              </Button>
            ) : (
              <Button onClick={login} variant="outline" className="mt-6 rounded-none gap-2" style={{ borderColor: '#1a1815', color: '#1a1815' }}>
                Log in to review
              </Button>
            )}
          </div>
        </motion.div>

        {/* Review form */}
        {showReviewForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-6" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#1a1815' }}>Your Review</h3>
            <form onSubmit={(e) => { e.preventDefault(); createReview.mutate(reviewData); }} className="space-y-4">
              <div>
                <Label className="mb-2 block" style={{ color: '#1a1815' }}>Rating *</Label>
                <StarRating rating={reviewData.rating} onRate={(r) => setReviewData({ ...reviewData, rating: r })} size="lg" />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#1a1815' }}>Title (optional)</Label>
                <Input value={reviewData.title} onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })} placeholder="Sum it up in a few words" />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#1a1815' }}>Review *</Label>
                <Textarea value={reviewData.content} onChange={(e) => setReviewData({ ...reviewData, content: e.target.value })} rows={4} placeholder="Share your thoughts..." required />
              </div>
              <PublishFeedback pending={createReview.isPending} error={createReview.error} />
              <div className="flex gap-3">
                <Button type="submit" className="rounded-none" disabled={!reviewData.rating || createReview.isPending} style={{ background: '#1a1815', color: '#faf8f2' }}>
                  {createReview.isPending ? 'Posting...' : 'Post Review'}
                </Button>
                <Button type="button" variant="outline" className="rounded-none" onClick={() => setShowReviewForm(false)} style={{ borderColor: '#1a1815', color: '#1a1815' }}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Reviews */}
        <section className="mt-10">
          <h2 className="font-playfair text-xl italic mb-4" style={{ color: '#1a1815' }}>Reviews ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} onClick={() => setOpenReview(review)} onKeyDown={e => { if (e.target === e.currentTarget && e.key === 'Enter') setOpenReview(review); }} role="button" tabIndex={0} className="block w-full text-left">
                  <ReviewCard review={review} showAlbum={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
              <p className="text-sm" style={{ color: '#8a7e6f' }}>No reviews yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {openReview && <ReviewDetailModal review={openReview} onClose={() => setOpenReview(null)} />}
      </AnimatePresence>
    </div>
  );
}