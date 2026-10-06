import React, { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

// Shows which database matched the tracklist, and lets the user manually
// re-search with a corrected title/artist if the match looks wrong.
export default function AlbumMatchPreview({ v, source, found, defaultTitle, defaultArtist, onRetry, retrying }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [artist, setArtist] = useState(defaultArtist);

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span style={{ color: v.muted }}>
          {found ? (source ? <>Matched via <span style={{ color: v.accent }}>{source}</span></> : 'Saved tracklist') : 'No match found'}
        </span>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ border: `1px solid ${v.accent}30`, color: v.accent }}
        >
          <RotateCcw className="w-3 h-3" /> {found ? 'Wrong album? Search again' : 'Search manually'}
        </button>
      </div>

      {open && (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
            placeholder="Album title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
            placeholder="Artist"
            value={artist}
            onChange={e => setArtist(e.target.value)}
          />
          <button
            disabled={!title.trim() || !artist.trim() || retrying}
            onClick={() => onRetry(title.trim(), artist.trim())}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
            style={{ background: v.accent, color: '#000', opacity: retrying ? 0.5 : 1 }}
          >
            <Search className="w-3 h-3" /> {retrying ? 'Searching…' : 'Search'}
          </button>
        </div>
      )}
    </div>
  );
}