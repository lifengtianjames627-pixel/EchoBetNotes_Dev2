import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/appClient';
import { getSessionLocation, subscribeLocation } from '@/features/location/model/sessionLocation';

/**
 * @param {{ id: string } | null | undefined} user
 * @param {number | false} [refetchInterval=false]
 */
export default function useChatDirectory(user, refetchInterval = false) {
  const current = useSyncExternalStore(subscribeLocation, getSessionLocation, () => null);
  const session = current?.userId === user?.id ? current : null;
  return useQuery({
    queryKey: ['chat-directory', user?.id, 'open-discovery', session],
    queryFn: async () => /** @type {import('@/features/location/model/directoryTypes').ChatDirectory} */ ((await apiClient.functions.invoke('chatDirectory', {
      ...(session ? { session_location: { lat: session.lat, lng: session.lng, source: session.source } } : {}),
    })).data),
    enabled: !!user?.id,
    refetchInterval,
  });
}