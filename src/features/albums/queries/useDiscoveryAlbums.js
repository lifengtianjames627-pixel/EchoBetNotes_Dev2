import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { refreshMusic } from '@/shared/reviews/catalog';
export default function useDiscoveryAlbums(onCreated) {
  const client = useQueryClient();
  const albums = useQuery({ queryKey: ['albums', 'discovery'], queryFn: () => base44.entities.Album.list('-created_date', 100) });
  const create = useMutation({
    mutationFn: (/** @type {{title: string, artist: string, genre: string, release_year: string, description: string, cover_url: string}} */ draft) => base44.entities.Album.create({
      title: draft.title.trim(), artist: draft.artist.trim(), type: 'album',
      ...(draft.genre ? { genre: draft.genre } : {}),
      ...(draft.release_year ? { release_year: Number(draft.release_year) } : {}),
      description: draft.description.trim(), cover_url: draft.cover_url.trim(), avg_rating: 0, review_count: 0,
    }),
    onSuccess: async () => {
      await refreshMusic(client);
      await client.invalidateQueries({ queryKey: ['albums'] });
      onCreated();
    },
  });
  return { albums, create };
}