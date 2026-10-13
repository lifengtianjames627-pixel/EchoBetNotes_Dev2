import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/appClient';
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
    return apiClient.entities.FriendRequest.subscribe(() => {
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