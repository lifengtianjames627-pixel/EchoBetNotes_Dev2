import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/appClient';
import { useState } from 'react';
import uploadPodcastAudio, { abortPodcastUpload } from '@/features/podcasts/api/uploadPodcastAudio';
export function usePodcastTotals() {
  return useQuery({ queryKey: ['podcasts', 'totals'], queryFn: () => apiClient.entities.Podcast.aggregate({ groupBy: 'category', sum: 'duration_minutes' }) });
}
export function usePodcastEpisodes(category) {
  return useInfiniteQuery({ queryKey: ['podcasts', 'series', category], initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const page = await apiClient.entities.Podcast.filter({ category }, { sort: '-created_date', limit: 20, cursor: pageParam });
      return { ...page, items: /** @type {import('@/features/podcasts/model/podcastTypes').PodcastEpisode[]} */ (page.items) };
    },
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, enabled: !!category });
}
export function usePublishPodcast(onSuccess) {
  const client = useQueryClient(), [progress, setProgress] = useState(0);
  const mutation = useMutation({
    mutationFn: async (/** @type {import('@/features/podcasts/model/podcastTypes').PodcastFields & { file: File, duration_minutes: number }} */ data) => {
      setProgress(0);
      const { file, ...metadata } = data;
      const uploadId = await uploadPodcastAudio(file, setProgress);
      try {
        const response = await apiClient.functions.invoke('publishPodcast', { ...metadata, upload_session_id: uploadId });
        setProgress(100);
        return response.data.episode;
      } catch (error) { await abortPodcastUpload(uploadId); throw error; }
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['podcasts'] }); client.invalidateQueries({ queryKey: ['homeFeed'] }); onSuccess(); },
  });
  return { ...mutation, progress };
}