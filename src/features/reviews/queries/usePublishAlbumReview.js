import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishAlbumReview } from '@/features/reviews/api/reviewWrites';
import { refreshMusic } from '@/features/reviews/queries/musicCache';

export default function usePublishAlbumReview({ album, user, moderate, onSuccess }) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: data => publishAlbumReview({ data, album, user, moderate }),
    onSuccess: async review => {
      await refreshMusic(client);
      onSuccess(review);
    },
  });
}