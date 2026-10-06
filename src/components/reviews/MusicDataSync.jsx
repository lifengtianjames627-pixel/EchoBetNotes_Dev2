import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isMusicQuery, refreshMusic } from '@/shared/reviews/catalog';
export default function MusicDataSync() {
  const client = useQueryClient();
  useEffect(() => {
    let timer;
    const changed = (kind, event) => {
      if (event.type === 'delete') {
        const prune = value => {
          if (Array.isArray(value)) return value.filter(x => !(x && (x.id === event.id || (kind === 'Album' && x.album_id === event.id)))).map(prune);
          if (!value || typeof value !== 'object') return value;
          if (value.id === event.id) return null;
          return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, prune(v)]));
        };
        client.setQueriesData({ predicate: isMusicQuery }, prune);
      }
      clearTimeout(timer);
      timer = setTimeout(() => refreshMusic(client), 200);
    };
    const stops = ['Album','Review','Podcast'].map(kind => base44.entities[kind].subscribe(e => changed(kind, e)));
    return () => { clearTimeout(timer); stops.forEach(stop => stop()); };
  }, [client]);
  return null;
}