import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishStoryReview } from '@/features/reviews/api/reviewWrites';
import { refreshMusic } from '@/features/reviews/queries/musicCache';

export default function usePublishStoryReview({ draft, user, moderate, onSuccess }) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => publishStoryReview({ draft, user, moderate }),
    onSuccess: async review => {
      await refreshMusic(client);
      onSuccess(review);
    },
  });
}