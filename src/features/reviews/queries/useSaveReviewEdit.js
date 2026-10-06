import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveReviewEdit } from '@/features/reviews/api/reviewWrites';
import { reviewKeys } from '@/features/reviews/queries/reviewKeys';
import { refreshMusic } from '@/features/reviews/queries/musicCache';

export default function useSaveReviewEdit({ review, draft, onSuccess }) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => saveReviewEdit(review, draft),
    onSuccess: async ({ review: saved }) => {
      client.setQueryData(reviewKeys.record(review.id), saved);
      await refreshMusic(client);
      onSuccess(saved);
    },
  });
}