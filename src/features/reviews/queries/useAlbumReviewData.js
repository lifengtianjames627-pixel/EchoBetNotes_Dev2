import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReviewAlbum, fetchAlbumReviews } from '@/features/reviews/api/reviewDetails';
import { visibleAlbumReviews } from '@/features/reviews/model/reviewRules';
import { reviewKeys } from '@/features/reviews/queries/reviewKeys';

const EMPTY = [];

export default function useAlbumReviewData(id, currentUser) {
  const { data: album, isLoading: loadingAlbum } = useQuery({
    queryKey: reviewKeys.album(id),
    queryFn: () => fetchReviewAlbum(id),
  });
  const { data: rawReviews = EMPTY } = useQuery({
    queryKey: reviewKeys.albumReviews(id),
    queryFn: () => fetchAlbumReviews(id),
  });
  const reviews = useMemo(() => visibleAlbumReviews(rawReviews, currentUser), [rawReviews, currentUser]);
  return { album, loadingAlbum, reviews };
}