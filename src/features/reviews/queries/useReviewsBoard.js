import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { fetchPublicReviews, fetchReviewsBoard, PUBLIC_REVIEW_LIMIT } from '@/features/reviews/api/reviewBoard';
import { groupPublicReviews } from '@/features/reviews/model/reviewRules';
import { reviewKeys } from '@/features/reviews/queries/reviewKeys';

const EMPTY = [];

export default function useReviewsBoard() {
  const { user, isAuthenticated } = useAuth();
  const viewerId = isAuthenticated ? user?.id : 'guest';
  const { data: board } = useQuery({
    queryKey: reviewKeys.board(viewerId),
    queryFn: fetchReviewsBoard,
  });
  const { data: reviews = EMPTY, isLoading, isError, refetch } = useQuery({
    queryKey: reviewKeys.publicList(viewerId, PUBLIC_REVIEW_LIMIT),
    queryFn: () => fetchPublicReviews(PUBLIC_REVIEW_LIMIT),
  });
  const groups = useMemo(() => groupPublicReviews(reviews), [reviews]);
  return { board, ...groups, isLoading, isError, refetch };
}