import { useQuery } from '@tanstack/react-query';
import { fetchReviewRecord } from '@/features/reviews/api/reviewDetails';
import { reviewKeys } from '@/features/reviews/queries/reviewKeys';

export default function useCurrentReview(seed) {
  const { data } = useQuery({
    queryKey: reviewKeys.record(seed?.id),
    enabled: !!seed?.id,
    queryFn: () => fetchReviewRecord(seed.id),
  });
  // Show the supplied record while loading; a deleted record stays absent.
  return data === undefined ? seed : data;
}