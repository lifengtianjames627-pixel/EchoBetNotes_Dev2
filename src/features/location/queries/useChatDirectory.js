import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSessionLocation, subscribeLocation } from '@/features/location/model/sessionLocation';

export default function useChatDirectory(user, refetchInterval = false) {
  const current = useSyncExternalStore(subscribeLocation, getSessionLocation, () => null);
  const session = current?.userId === user?.id ? current : null;
  return useQuery({
    queryKey: ['chat-directory', user?.id, 'open-discovery', session],
    queryFn: async () => (await base44.functions.invoke('chatDirectory', {
      ...(session ? { session_location: { lat: session.lat, lng: session.lng, source: session.source } } : {}),
    })).data,
    enabled: !!user?.id,
    refetchInterval,
  });
}