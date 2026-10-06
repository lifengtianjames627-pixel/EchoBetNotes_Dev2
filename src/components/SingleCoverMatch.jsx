import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchCoverCascade } from '@/components/TrackList';
import AlbumMatchPreview from '@/components/AlbumMatchPreview';
import { storeCoverImage } from '@/lib/storeCoverImage';

// Gives singles the same "search every database, let me retry with a corrected
// title/artist" behavior that albums get for tracklists — singles have no
// tracklist, so this only searches for the cover art.
export default function SingleCoverMatch({ item, v, onDataFetched }) {
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(!!item.cover_url);
  const [source, setSource] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const requestIdRef = useRef(0);

  const runFetch = (title, artist, isRetry) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    if (isRetry) setPendingUpdate(null);
    fetchCoverCascade(title, artist, item.genre).then(async result => {
      if (requestId !== requestIdRef.current) return;
      setFetched(true);
      setSource(result?.source || null);
      if (result?.coverUrl) {
        const cover_url = await storeCoverImage(result.coverUrl);
        if (requestId !== requestIdRef.current) return;
        const update = { cover_url };
        if (isRetry) {
          setPendingUpdate(update);
        } else {
          onDataFetched?.(update);
          base44.entities.Album.update(item.id, update);
        }
      }
      setLoading(false);
    });
  };

  const handleSave = async () => {
    if (!pendingUpdate) return;
    onDataFetched?.(pendingUpdate);
    await base44.entities.Album.update(item.id, pendingUpdate);
    setPendingUpdate(null);
  };

  useEffect(() => {
    if (item.cover_url) return;
    runFetch(item.title, item.artist, false);
  }, [item.id]);

  return (
    <div className="px-5 pb-4">
      {loading && (
        <div className="flex items-center gap-2 py-1" style={{ color: v.muted }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Searching for cover art…</span>
        </div>
      )}

      {fetched && !loading && (
        <AlbumMatchPreview
          v={v}
          source={source}
          found={!!item.cover_url || !!pendingUpdate}
          defaultTitle={item.title}
          defaultArtist={item.artist}
          retrying={loading}
          onRetry={(title, artist) => runFetch(title, artist, true)}
        />
      )}

      {pendingUpdate && (
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: v.accent, color: '#000' }}
        >
          <Save className="w-3.5 h-3.5" /> Save this match
        </button>
      )}
    </div>
  );
}