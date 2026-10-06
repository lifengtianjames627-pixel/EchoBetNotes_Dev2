import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Loader2, ListMusic, ChevronDown, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AlbumMatchPreview from '@/components/AlbumMatchPreview';
import { storeCoverImage } from '@/lib/storeCoverImage';

const MB_HEADERS = { 'User-Agent': 'MusicCritics/1.0 (musiccritics@app.com)' };

// ── Matching helpers ──────────────────────────────────────────────────────
// Used to pick the candidate whose name is actually closest to what the user typed,
// instead of blindly trusting the first result (this is what caused mismatches on JP titles).

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');
}

function bigramSet(str) {
  const s = normalize(str);
  if (s.length < 2) return new Set([s]);
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

// Dice coefficient — works well for both Latin and CJK text
function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const setA = bigramSet(na), setB = bigramSet(nb);
  let overlap = 0;
  setA.forEach(g => { if (setB.has(g)) overlap++; });
  return (2 * overlap) / (setA.size + setB.size);
}

function matchScore(candidateTitle, candidateArtist, title, artist) {
  return similarity(candidateTitle, title) * 0.65 + similarity(candidateArtist, artist) * 0.35;
}

// Below this, a candidate is considered "not actually the same album" and gets rejected
// instead of being returned as a false-positive match.
const MIN_MATCH_SCORE = 0.4;

// ── MusicBrainz helpers ──────────────────────────────────────────────────────

async function mbSearch(query, limit = 10) {
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`,
      { headers: MB_HEADERS }
    );
    const data = await res.json();
    return data.releases || [];
  } catch { return []; }
}

async function mbGetTracks(releaseId) {
  const res = await fetch(
    `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`,
    { headers: MB_HEADERS }
  );
  const data = await res.json();
  const tracks = [];
  (data.media || []).forEach(m => (m.tracks || []).forEach(t => tracks.push(t.title)));
  return tracks;
}

async function mbGetCover(releaseId, releaseGroupId) {
  for (const url of [
    `https://coverartarchive.org/release/${releaseId}`,
    releaseGroupId && `https://coverartarchive.org/release-group/${releaseGroupId}`,
  ].filter(Boolean)) {
    try {
      const res = await fetch(url, { headers: MB_HEADERS });
      if (res.ok) {
        const data = await res.json();
        const front = data.images?.find(i => i.front) || data.images?.[0];
        if (front) return front.thumbnails?.['500'] || front.thumbnails?.large || front.image;
      }
    } catch {}
  }
  return null;
}

async function fetchFromMusicBrainz(title, artist, year) {
  // 4 search strategies: exact → loose → alias (romanized names) → title only
  const queries = [
    `release:"${title}" AND artist:"${artist}"`,
    `release:${title} AND artist:${artist}`,
    `release:"${title}" AND alias:"${artist}"`,  // catches romanized Japanese/Korean artist names
    `release:"${title}"`,
  ];

  let best = null;
  let bestScore = -1;
  for (const q of queries) {
    const releases = await mbSearch(q);
    if (!releases.length) continue;
    for (const r of releases) {
      let score = matchScore(r.title, r['artist-credit']?.[0]?.name || '', title, artist);
      if (year && r.date?.startsWith(String(year))) score += 0.1;
      if (score > bestScore) { bestScore = score; best = r; }
    }
    if (best) break;
  }
  if (!best || bestScore < MIN_MATCH_SCORE) return null;

  const [tracks, coverUrl] = await Promise.all([
    mbGetTracks(best.id),
    mbGetCover(best.id, best['release-group']?.id),
  ]);
  return tracks.length ? { tracks, coverUrl, source: 'MusicBrainz' } : null;
}

// ── iTunes Search API (Apple) ────────────────────────────────────────────────
// Free, no key needed. Each country storefront carries its own local catalog,
// so we query the regional stores that matter most (KR, JP, CN, US) in parallel
// instead of relying only on the default US catalog.

const ITUNES_STOREFRONTS = ['us', 'kr', 'jp', 'cn'];

async function itunesSearchAlbums(title, artist, country) {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=album&limit=5&country=${country}`
    );
    const data = await res.json();
    return (data.results || []).map(r => ({ ...r, _country: country }));
  } catch { return []; }
}

async function fetchFromItunes(title, artist) {
  try {
    const resultsByStore = await Promise.all(
      ITUNES_STOREFRONTS.map(c => itunesSearchAlbums(title, artist, c))
    );
    const allResults = resultsByStore.flat();
    if (!allResults.length) return null;

    // Pick whichever candidate (from any storefront) best matches the user's input
    let album = null, bestScore = -1;
    for (const r of allResults) {
      const score = matchScore(r.collectionName, r.artistName, title, artist);
      if (score > bestScore) { bestScore = score; album = r; }
    }
    if (!album || bestScore < MIN_MATCH_SCORE) return null;

    // Fetch tracks for this album from the same storefront it was found in
    const trackRes = await fetch(
      `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&country=${album._country}`
    );
    const trackData = await trackRes.json();
    const tracks = (trackData.results || [])
      .filter(r => r.wrapperType === 'track')
      .sort((a, b) => a.trackNumber - b.trackNumber)
      .map(r => r.trackName);

    // Cover: iTunes gives 100x100, upgrade to 600x600
    const coverUrl = album.artworkUrl100?.replace('100x100', '600x600') || null;

    return tracks.length ? { tracks, coverUrl, source: `iTunes (${album._country.toUpperCase()})` } : null;
  } catch { return null; }
}

// Singles are individual tracks, not releases — searching iTunes/MusicBrainz as an
// "album" (like we do for full albums) often finds nothing because the single was
// never released as its own standalone release. Search the song/track endpoint
// directly instead, which matches on the track itself.

async function itunesSearchSongs(title, artist, country) {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=song&limit=5&country=${country}`
    );
    const data = await res.json();
    return (data.results || []).map(r => ({ ...r, _country: country }));
  } catch { return []; }
}

async function fetchSingleFromItunes(title, artist) {
  try {
    const resultsByStore = await Promise.all(
      ITUNES_STOREFRONTS.map(c => itunesSearchSongs(title, artist, c))
    );
    const allResults = resultsByStore.flat();
    if (!allResults.length) return null;

    let track = null, bestScore = -1;
    for (const r of allResults) {
      const score = matchScore(r.trackName, r.artistName, title, artist);
      if (score > bestScore) { bestScore = score; track = r; }
    }
    if (!track || bestScore < MIN_MATCH_SCORE) return null;

    const coverUrl = track.artworkUrl100?.replace('100x100', '600x600') || null;
    return coverUrl ? { coverUrl, source: `iTunes Song (${track._country.toUpperCase()})` } : null;
  } catch { return null; }
}

// ── Last.fm API ──────────────────────────────────────────────────────────────
// Strong global database, good for obscure / non-Western artists

async function fetchFromLastfm(title, artist) {
  try {
    // Last.fm has a public API that works without key for getInfo
    const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=c9d2b37e0f9ecd8ef5c3b4f09a122d54&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(title)}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const album = data.album;
    if (!album) return null;

    const tracks = (album.tracks?.track || []).map(t =>
      typeof t === 'string' ? t : t.name
    );
    const coverUrl = album.image?.find(i => i.size === 'extralarge')?.['#text'] ||
                     album.image?.find(i => i.size === 'large')?.['#text'] || null;

    return tracks.length ? { tracks, coverUrl: coverUrl || null, source: 'Last.fm' } : null;
  } catch { return null; }
}

// ── ACG title resolution ──────────────────────────────────────────────────────
// ACG (anime/game/comic) albums are often saved under a Chinese fan title
// (e.g. 死神, 恶魔城) which no music database indexes. Resolve the official
// Japanese/English title + composer via an LLM before searching.

async function resolveAcgTitle(title, artist) {
  try {
    const res = await base44.functions.invoke('resolveAcgTitle', { title, artist });
    return res.data;
  } catch { return null; }
}

// ── NetEase Cloud Music ────────────────────────────────────────────────────
// Best coverage for anime/game soundtracks (way ahead of MusicBrainz/iTunes/
// Last.fm here) — used as the primary source for ACG albums.

async function fetchFromNetease(title, artist) {
  try {
    const res = await base44.functions.invoke('fetchNetease', { title, artist });
    return res.data?.tracks?.length ? res.data : null;
  } catch { return null; }
}

// ── Main fetch orchestrator ──────────────────────────────────────────────────

async function fetchTracklist(title, artist, year, genre, skipAcgResolve) {
  let searchTitle = title, searchArtist = artist;
  if (genre === 'acg' && !skipAcgResolve) {
    const resolved = await resolveAcgTitle(title, artist);
    if (resolved?.title) { searchTitle = resolved.title; searchArtist = resolved.artist || artist; }
  }

  if (genre === 'acg') {
    const netease = await fetchFromNetease(searchTitle, searchArtist);
    if (netease) return netease;
  }

  const results = (await Promise.all([
    fetchFromMusicBrainz(searchTitle, searchArtist, year),
    fetchFromItunes(searchTitle, searchArtist),
  ])).filter(r => r?.tracks?.length);
  if (!results.length) {
    const lastfm = await fetchFromLastfm(searchTitle, searchArtist);
    if (lastfm) return lastfm;
    // Final fallback for any genre — NetEase covers a lot that Western databases miss.
    return await fetchFromNetease(searchTitle, searchArtist);
  }

  const best = results.find(r => r.source === 'MusicBrainz') || results[0];

  // Backfill missing cover from another source
  if (!best.coverUrl) {
    const withCover = results.find(r => r.coverUrl);
    if (withCover) best.coverUrl = withCover.coverUrl;
  }
  return best;
}

// Cascades through all 4 sources looking only for a cover image (used for singles,
// which have no tracklist but still need the same "try every database" guarantee albums get).
export async function fetchCoverCascade(title, artist, genre) {
  if (genre === 'acg') {
    const netease = await fetchFromNetease(title, artist);
    if (netease?.coverUrl) return { coverUrl: netease.coverUrl, source: 'NetEase' };
  }

  // Try the track/song search first — singles usually aren't indexed as their
  // own release, so the release-based searches below often can't find them at all.
  const songResult = await fetchSingleFromItunes(title, artist);
  if (songResult) return songResult;

  const results = (await Promise.all([
    fetchFromMusicBrainz(title, artist),
    fetchFromItunes(title, artist),
  ])).filter(Boolean);
  const withCover = results.find(r => r.coverUrl);
  if (withCover) return { coverUrl: withCover.coverUrl, source: withCover.source };

  const lastfm = await fetchFromLastfm(title, artist);
  if (lastfm?.coverUrl) return { coverUrl: lastfm.coverUrl, source: 'Last.fm' };

  const netease = await fetchFromNetease(title, artist);
  if (netease?.coverUrl) return { coverUrl: netease.coverUrl, source: 'NetEase' };

  return null;
}

export default function TrackList({ item, v, onDataFetched, onTrackClick }) {
  const [tracks, setTracks] = useState(item.tracklist || []);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(item.tracklist?.length > 0);
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState(null);
  // Holds a manually-retried match that's been previewed but not saved yet —
  // the user confirms it with the Save button before it's written to the album.
  const [pendingUpdate, setPendingUpdate] = useState(null);
  // Guards against out-of-order responses: if the user retries again before an
  // earlier search resolves, only the most recent request's result gets applied/saved.
  const requestIdRef = useRef(0);

  const runFetch = (title, artist, isRetry) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    if (isRetry) setPendingUpdate(null);
    fetchTracklist(title, artist, item.release_year, item.genre, isRetry).then(async result => {
      if (requestId !== requestIdRef.current) return; // a newer search superseded this one
      setFetched(true);
      setSource(result?.source || null);
      if (result?.tracks?.length) {
        setTracks(result.tracks);
        const update = { tracklist: result.tracks };
        if ((isRetry || !item.cover_url) && result.coverUrl) {
          update.cover_url = await storeCoverImage(result.coverUrl);
        }
        if (requestId !== requestIdRef.current) return;
        onDataFetched?.(update);
        if (isRetry) {
          // Manual re-search — preview only, wait for explicit Save.
          setPendingUpdate(update);
        } else {
          // Initial automatic match — save right away as before.
          base44.entities.Album.update(item.id, update);
        }
      } else if (isRetry) {
        setTracks([]);
      }
      setLoading(false);
    });
  };

  const handleSave = async () => {
    if (!pendingUpdate) return;
    await base44.entities.Album.update(item.id, pendingUpdate);
    setPendingUpdate(null);
  };

  useEffect(() => {
    if (item.type === 'single' || fetched) return;
    runFetch(item.title, item.artist, false);
  }, [item.id]);

  if (item.type === 'single') return null;

  return (
    <div className="px-5 pb-4">
      <button
        onClick={() => tracks.length > 0 && setExpanded(e => !e)}
        className="flex items-center gap-2 mb-3 w-full text-left"
        style={{ cursor: tracks.length > 0 ? 'pointer' : 'default' }}
      >
        <ListMusic className="w-3.5 h-3.5" style={{ color: v.accent }} />
        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: v.muted }}>Tracklist</p>
        {tracks.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${v.accent}15`, color: v.accent }}>
            {tracks.length} tracks
          </span>
        )}
        {tracks.length > 0 && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-auto">
            <ChevronDown className="w-4 h-4" style={{ color: v.muted }} />
          </motion.div>
        )}
      </button>

      {loading ? (
        <div className="flex items-center gap-2 py-3" style={{ color: v.muted }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Fetching tracklist…</span>
        </div>
      ) : tracks.length > 0 ? (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-1">
                {tracks.map((track, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => onTrackClick?.(track)}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left transition-colors hover:brightness-125"
                    style={{ background: `${v.accent}07` }}
                  >
                    <span className="text-xs w-5 text-right shrink-0 font-mono" style={{ color: `${v.muted}80` }}>{i + 1}</span>
                    <Music className="w-3 h-3 shrink-0" style={{ color: `${v.accent}60` }} />
                    <span className="text-sm" style={{ color: v.text }}>{track}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <p className="text-xs py-2" style={{ color: `${v.muted}80` }}>Tracklist not found across MusicBrainz, iTunes & Last.fm.</p>
      )}

      {fetched && (
        <AlbumMatchPreview
          v={v}
          source={source}
          found={tracks.length > 0}
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