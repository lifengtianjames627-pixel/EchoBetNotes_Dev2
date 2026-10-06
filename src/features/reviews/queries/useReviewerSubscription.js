import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { displayName } from '@/lib/displayName';
import { notify } from '@/lib/notify';

export default function useReviewerSubscription(review, currentUser) {
  const queryClient = useQueryClient();
  const email = currentUser?.email;
  const target = review.reviewer_email;
  const canSubscribe = !!email && !!target && email !== target;
  const queryKey = ['my-sub', target, email];
  const query = useQuery({
    queryKey,
    queryFn: () => base44.entities.Subscription.filter({ subscriber_email: email, target_email: target }),
    enabled: canSubscribe,
  });
  const subscriptions = query.data || [];
  const isSubscribed = subscriptions.length > 0;
  const mutation = useMutation({
    mutationFn: async () => {
      if (!canSubscribe || query.isPending || query.isError) return;
      if (isSubscribed) {
        await Promise.all(subscriptions.map(item => base44.entities.Subscription.delete(item.id)));
      } else {
        await base44.entities.Subscription.create({
          subscriber_email: email, subscriber_name: displayName(currentUser),
          target_email: target, target_name: review.reviewer_name || '',
        });
        notify({ owner_email: target, type: 'follow',
          title: `${displayName(currentUser)} started following you`,
          link: `/u/${encodeURIComponent(email)}`, actor_name: displayName(currentUser) });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-sub', target, email] }),
  });
  return { canSubscribe, isSubscribed, mutation, query };
}