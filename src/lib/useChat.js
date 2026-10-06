import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { displayName } from '@/lib/displayName';

// Shared chat data layer for both the mini popup and the full page.
//
// Latency comes from three things, all handled here:
//  1. Realtime subscription — new messages land the moment they're written instead of
//     waiting for the next poll (polling stays as a slow safety net).
//  2. Optimistic send — your own bubble appears instantly, before the round trip.
//  3. placeholderData — the list never flickers or empties between refetches.

export function makeChatId(a, b) {
  return [a, b].sort().join('|');
}

export function useChat({ chatId, currentUser, limit = 200 }) {
  const queryClient = useQueryClient();
  const queryKey = ['chat', chatId];

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.ChatMessage.filter({ chat_id: chatId }, 'created_date', limit),
    enabled: !!chatId,
    refetchInterval: 8000,
    placeholderData: (prev) => prev,
    staleTime: 0,
  });

  // Realtime: react to writes as they happen rather than on a timer.
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event?.data?.chat_id === chatId) {
        queryClient.invalidateQueries({ queryKey });
      }
    });
    return unsubscribe;
  }, [chatId]);

  // Accepts either a plain string or { content, attachment_url, attachment_name, attachment_kind }.
  const normalize = (payload) => (typeof payload === 'string' ? { content: payload } : payload);

  const send = useMutation({
    mutationFn: (payload) => base44.entities.ChatMessage.create({
      chat_id: chatId,
      participants: chatId.split('|'),
      sender_email: currentUser.email,
      sender_name: displayName(currentUser),
      ...normalize(payload),
    }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey) || [];
      queryClient.setQueryData(queryKey, [
        ...previous,
        {
          id: `pending-${Date.now()}`,
          chat_id: chatId,
          sender_email: currentUser.email,
          sender_name: displayName(currentUser),
          ...normalize(payload),
          created_date: new Date().toISOString(),
          _pending: true,
        },
      ]);
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { messages, isLoading, send };
}