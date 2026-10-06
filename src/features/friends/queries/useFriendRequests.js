import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { listFriendRequests, saveFriendRequest } from '@/features/friends/api/friendRequests';

export default function useFriendRequests(email, peer) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['friend-requests', email, peer || null],
    queryFn: () => listFriendRequests(email, peer),
    enabled: !!email,
  });
  useEffect(() => {
    if (!email) return;
    return base44.entities.FriendRequest.subscribe(() => {
      client.invalidateQueries({ queryKey: ['friend-requests', email] });
    });
  }, [email, client]);
  return query;
}

export function useFriendMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveFriendRequest,
    onSettled: () => client.invalidateQueries({ queryKey: ['friend-requests'] }),
  });
}