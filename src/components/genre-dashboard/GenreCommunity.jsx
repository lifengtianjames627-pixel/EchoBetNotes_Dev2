import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReviewFeed from '@/components/reviews/ReviewFeed';
import { withCurrentAlbums } from '@/shared/reviews/catalog';

export default function GenreCommunity({ albumIds, accent, text }) {
  const navigate = useNavigate();
  const { data: reviews = [] } = useQuery({ queryKey: ['public-reviews'], queryFn: async () => withCurrentAlbums(await base44.entities.Review.list('-created_date', 60)) });
  const localReviews = reviews.filter(review => albumIds.includes(review.album_id) && (!review.moderation_status || review.moderation_status === 'approved')).slice(0, 6);
  return <section className="mt-16 border-t pt-10" style={{ borderColor: `${accent}35` }}><ReviewFeed reviews={localReviews} onOpen={id => navigate(`/album/${id}`)} accent={accent} text={text} /></section>;
}