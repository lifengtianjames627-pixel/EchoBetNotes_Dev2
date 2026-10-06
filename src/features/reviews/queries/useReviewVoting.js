import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { refreshMusic } from '@/features/reviews/queries/musicCache';
import { notifyReviewLike } from '@/features/reviews/api/voteEffects';

/** @typedef {{vote: 'like'|'dislike'|null, vote_id: string|null, previous_vote: 'like'|'dislike'|null, likes_count: number, dislikes_count: number}} VoteResult */
export default function useReviewVoting({ review, currentUser }) {
  const client = useQueryClient();
  const key = ['my-vote', review.id, currentUser?.id];
  const votes = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.ReviewVote.filter({ review_id: review.id, voter_email: currentUser.email }, '-updated_date'),
    enabled: !!currentUser?.email,
  });
  const myVote = votes.data?.[0]?.vote || null;
  const [counts, setCounts] = useState({ likes_count: review.likes_count || 0, dislikes_count: review.dislikes_count || 0 });
  useEffect(() => {
    setCounts({ likes_count: review.likes_count || 0, dislikes_count: review.dislikes_count || 0 });
  }, [review.id, review.likes_count, review.dislikes_count]);
  const voteMutation = useMutation({
    mutationFn: async (/** @type {'like'|'dislike'} */ type) => {
      const response = await base44.functions.invoke('voteReview', { review_id: review.id, vote: myVote === type ? null : type });
      return /** @type {VoteResult} */ (response.data);
    },
    onSuccess: async result => {
      setCounts({ likes_count: result.likes_count, dislikes_count: result.dislikes_count });
      client.setQueryData(key, result.vote ? [{ id: result.vote_id, vote: result.vote }] : []);
      await Promise.all([client.invalidateQueries({ queryKey: key }), refreshMusic(client)]);
      if (result.vote === 'like' && result.previous_vote !== 'like') {
        notifyReviewLike(review, currentUser, client).catch(() => console.error('Post-vote badge check failed'));
      }
    },
  });
  return { voteMutation, myVote, likesCount: counts.likes_count, dislikesCount: counts.dislikes_count,
    voteLoading: !!currentUser?.email && votes.isPending };
}