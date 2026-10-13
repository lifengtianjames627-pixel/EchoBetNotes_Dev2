import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import CoverImage from '@/components/music/CoverImage';
import { SERIES_COVERS } from '@/features/podcasts/model/seriesCovers';
/** @param {{ episode: import('@/features/podcasts/model/podcastTypes').PodcastEpisode, className: string, alt?: string }} props */
export default function PodcastCoverImage({ episode, className, alt = '' }) {
  const { isAuthenticated } = useAuth();
  const cover = useQuery({ queryKey: ['podcasts', 'cover', episode.id], enabled: !!(isAuthenticated && episode.has_uploaded_cover), staleTime: 45 * 60 * 1000,
    queryFn: async () => { const response = await apiClient.functions.invoke('getPodcastAudio', { podcast_id: episode.id, kind: 'cover' }); return response.data.signed_url; } });
  const src = cover.data || episode.cover_url || SERIES_COVERS[episode.category];
  return <CoverImage key={src} src={src} alt={alt} className={className} />;
}