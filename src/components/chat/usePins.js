import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { publicName } from '@/shared/identity';

// Pinned people live on their own records so they survive across devices.
export function usePins(currentUser) {
  const queryClient = useQueryClient();
  const email = currentUser?.email;

  const { data: pins = [] } = useQuery({
    queryKey: ['pinned-peers', email],
    queryFn: () => base44.entities.PinnedPeer.filter({ owner_email: email }, '-created_date', 50),
    enabled: !!email,
  });

  const toggle = useMutation({
    mutationFn: async ({ peer_email, peer_name }) => {
      const existing = pins.find(p => p.peer_email === peer_email);
      if (existing) return base44.entities.PinnedPeer.delete(existing.id);
      return base44.entities.PinnedPeer.create({ owner_email: email, peer_email, peer_name: publicName(peer_name) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pinned-peers', email] }),
  });

  const isPinned = (peer_email) => pins.some(p => p.peer_email === peer_email);

  return { pins, isPinned, toggle };
}