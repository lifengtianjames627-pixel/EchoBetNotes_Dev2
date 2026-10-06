import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GENRES } from '@/lib/genreConfig';
import { ArrowLeft } from 'lucide-react';
import MusicSlider from '@/components/MusicSlider';
import AddMusicModal from '@/components/AddMusicModal';
import MusicItemDetail from '@/components/MusicItemDetail';
import GenreRankings from '@/components/GenreRankings';
import GenreHero from '@/components/genre-dashboard/GenreHero';
import GenreEmptyState from '@/components/genre-dashboard/GenreEmptyState';
import GenreCommunity from '@/components/genre-dashboard/GenreCommunity';
import { buildGenreTheme, GENRE_SLUG_ALIASES, PAPER } from '@/lib/genreSkins';
import { storeCoverImage } from '@/lib/storeCoverImage';
import { fetchCoverCascade } from '@/components/TrackList';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import { trackGenre } from '@/lib/trackGenre';
import ScoreGenreRail from '@/components/ScoreGenreRail';

// Per-genre visual configs
const GENRE_VISUALS = {
  rock: {
    bg: 'radial-gradient(ellipse at 30% 20%, #1a0a0a 0%, #0d0505 60%, #080303 100%)',
    accent: '#e63946', accentGlow: 'rgba(230,57,70,0.4)',
    text: '#f5e0e0', muted: '#9a7070',
    cardBg: 'rgba(40,15,15,0.8)', cardBorder: 'rgba(230,57,70,0.2)',
    headerStyle: { fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase' },
    tagline: 'Underground · Raw · Alive',
  },
  pop: {
    bg: 'radial-gradient(ellipse at 60% 10%, #1a0a1a 0%, #0e0510 60%, #060308 100%)',
    accent: '#ec407a', accentGlow: 'rgba(236,64,122,0.4)',
    text: '#fce4ec', muted: '#a07080',
    cardBg: 'rgba(40,10,30,0.8)', cardBorder: 'rgba(236,64,122,0.2)',
    headerStyle: { fontWeight: 700, letterSpacing: '-0.01em' },
    tagline: 'Clean · Bright · Now',
  },
  classical: {
    bg: 'radial-gradient(ellipse at 50% 0%, #120e06 0%, #0a0802 60%, #050401 100%)',
    accent: '#d4a017', accentGlow: 'rgba(212,160,23,0.35)',
    text: '#f2ead8', muted: '#8a7a60',
    cardBg: 'rgba(30,22,8,0.85)', cardBorder: 'rgba(212,160,23,0.18)',
    headerStyle: { fontFamily: 'Georgia, serif', fontWeight: 500, letterSpacing: '0.02em' },
    tagline: 'Timeless · Precise · Profound',
  },
  metal: {
    bg: 'radial-gradient(ellipse at 35% 8%, #301015 0%, #10121b 48%, #06070b 100%)',
    accent: '#cc1111', accentGlow: 'rgba(204,17,17,0.45)',
    text: '#e0e0e0', muted: '#666',
    cardBg: 'rgba(15,10,10,0.9)', cardBorder: 'rgba(204,17,17,0.25)',
    headerStyle: { fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase' },
    tagline: 'Heavy · Dark · Relentless',
  },
  jazz: {
    bg: 'radial-gradient(ellipse at 40% 10%, #0a1020 0%, #070b18 60%, #040810 100%)',
    accent: '#d4a017', accentGlow: 'rgba(212,160,23,0.35)',
    text: '#d4c5a9', muted: '#8a7a66',
    cardBg: 'rgba(15,20,40,0.85)', cardBorder: 'rgba(212,160,23,0.18)',
    headerStyle: { fontFamily: 'Georgia, serif', fontWeight: 400, letterSpacing: '0.03em' },
    tagline: 'Improvised · Intimate · Late Night',
  },
  blues: {
    bg: 'radial-gradient(ellipse at 30% 20%, #08101a 0%, #050c14 60%, #020608 100%)',
    accent: '#5c8ab5', accentGlow: 'rgba(92,138,181,0.4)',
    text: '#b0c8d8', muted: '#507080',
    cardBg: 'rgba(10,20,35,0.85)', cardBorder: 'rgba(92,138,181,0.2)',
    headerStyle: { fontWeight: 600, letterSpacing: '0.01em' },
    tagline: 'Slow · Honest · Deep',
  },
  r_and_b: {
    bg: 'radial-gradient(ellipse at 50% 0%, #140820 0%, #0c0518 60%, #060210 100%)',
    accent: '#b47fff', accentGlow: 'rgba(180,127,255,0.4)',
    text: '#e0d0f0', muted: '#9070b0',
    cardBg: 'rgba(25,10,45,0.85)', cardBorder: 'rgba(180,127,255,0.2)',
    headerStyle: { fontWeight: 500, letterSpacing: '0.01em' },
    tagline: 'Smooth · Soulful · Night',
  },
  core: {
    bg: '#000000',
    accent: '#ffffff', accentGlow: 'rgba(255,255,255,0.25)',
    text: '#f0f0f0', muted: '#606060',
    cardBg: 'rgba(10,10,10,0.95)', cardBorder: 'rgba(255,255,255,0.12)',
    headerStyle: { fontWeight: 900, letterSpacing: '-0.06em', textTransform: 'uppercase' },
    tagline: 'Punk · Extreme Core',
  },
  country: {
    bg: 'radial-gradient(ellipse at 50% 0%, #100c04 0%, #0a0802 60%, #060500 100%)',
    accent: '#a0522d', accentGlow: 'rgba(160,82,45,0.4)',
    text: '#f5e8cc', muted: '#8a7a5a',
    cardBg: 'rgba(28,20,8,0.85)', cardBorder: 'rgba(160,82,45,0.2)',
    headerStyle: { fontWeight: 600 },
    tagline: 'Warm · Story-driven · Real',
  },
  hip_hop: {
    bg: 'radial-gradient(ellipse at 50% 0%, #0c0c0c 0%, #070707 100%)',
    accent: '#f5c518', accentGlow: 'rgba(245,197,24,0.4)',
    text: '#f0f0f0', muted: '#888',
    cardBg: 'rgba(18,18,18,0.92)', cardBorder: 'rgba(245,197,24,0.2)',
    headerStyle: { fontWeight: 800, letterSpacing: '-0.03em' },
    tagline: 'Culture · Rhythm · Truth',
  },
  indie: {
    bg: 'radial-gradient(ellipse at 40% 10%, #0a0e08 0%, #070a05 60%, #040602 100%)',
    accent: '#7a8a6a', accentGlow: 'rgba(122,138,106,0.4)',
    text: '#dde8cc', muted: '#7a8a6a',
    cardBg: 'rgba(15,20,10,0.85)', cardBorder: 'rgba(122,138,106,0.2)',
    headerStyle: { fontWeight: 400, letterSpacing: '0.01em' },
    tagline: 'Curious · Unfiltered · Yours',
  },
  grunge: {
    bg: 'radial-gradient(ellipse at 30% 20%, #100c06 0%, #0a0804 60%, #060502 100%)',
    accent: '#8b7355', accentGlow: 'rgba(139,115,85,0.4)',
    text: '#c8b89a', muted: '#80706a',
    cardBg: 'rgba(22,18,10,0.88)', cardBorder: 'rgba(139,115,85,0.2)',
    headerStyle: { fontWeight: 600, letterSpacing: '-0.01em' },
    tagline: 'Distorted · Raw · Unapologetic',
  },
  electronic: {
    bg: 'radial-gradient(ellipse at 50% 0%, #020d1f 0%, #010810 60%, #000408 100%)',
    accent: '#4080ff', accentGlow: 'rgba(64,128,255,0.45)',
    text: '#c8d8f0', muted: '#5080a0',
    cardBg: 'rgba(5,15,40,0.85)', cardBorder: 'rgba(64,128,255,0.2)',
    headerStyle: { fontWeight: 500, letterSpacing: '0.04em' },
    tagline: 'Synthetic · Future · Dance',
  },
  funk: {
    bg: 'radial-gradient(ellipse at 50% 0%, #1f1a02 0%, #120e01 60%, #0a0700 100%)',
    accent: '#fbbf24', accentGlow: 'rgba(251,191,36,0.4)',
    text: '#fde68a', muted: '#a08a50',
    cardBg: 'rgba(45,38,8,0.85)', cardBorder: 'rgba(251,191,36,0.2)',
    headerStyle: { fontWeight: 700, letterSpacing: '-0.01em' },
    tagline: 'Groovy · Loose · Alive',
  },
  acg: {
    bg: 'radial-gradient(ellipse at 50% 0%, #021f1f 0%, #011212 60%, #000a0a 100%)',
    accent: '#22d3ee', accentGlow: 'rgba(34,211,238,0.4)',
    text: '#a5f3fc', muted: '#4a9098',
    cardBg: 'rgba(8,40,45,0.85)', cardBorder: 'rgba(34,211,238,0.2)',
    headerStyle: { fontWeight: 600, letterSpacing: '0.01em' },
    tagline: 'Nostalgic · Epic · Playful',
  },
  cinematic: {
    bg: 'radial-gradient(ellipse at 50% 0%, #1a1408 0%, #100d05 60%, #080602 100%)',
    accent: '#d4a24c', accentGlow: 'rgba(212,162,76,0.4)',
    text: '#f0dcb0', muted: '#8a7550',
    cardBg: 'rgba(35,28,12,0.85)', cardBorder: 'rgba(212,162,76,0.2)',
    headerStyle: { fontFamily: 'Georgia, serif', fontWeight: 500, letterSpacing: '0.01em' },
    tagline: 'Sweeping · Dramatic · Immersive',
  },
};

export default function GenreSpace() {
  const { genreId: rawGenreId } = useParams();
  // Accept /genre/rnb, /genre/r&b, /genre/hip-hop as aliases of the real ids.
  const genreId = GENRE_SLUG_ALIASES[decodeURIComponent(rawGenreId || '').toLowerCase()] || rawGenreId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLang();
  // Genre name / tagline / description are system copy — they follow the system
  // language. Album titles, artist names and review text never do.
  const { gLabel, gTagline, gDesc } = useGenreText();

  const [addModal, setAddModal] = useState(null); // 'album' | 'single' | null
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    // Increment click count for popularity tracking
    base44.entities.Album.update(item.id, { click_count: (item.click_count || 0) + 1 });
  };

  const genre = GENRES.find(g => g.id === genreId);
  // Three-layer theme: fixed cream page base + fixed nav, with only the genre
  // skin (accent, hero overlay, title typography, card radius) changing.
  const v = {
    ...(GENRE_VISUALS[genreId] || GENRE_VISUALS.electronic),
    tagline: (GENRE_VISUALS[genreId] || GENRE_VISUALS.electronic).tagline,
    ...buildGenreTheme(genreId),
  };
  const skin = v.skin;
  const entityGenre = genre?.entityGenre;

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['genre-albums', genreId],
    queryFn: async () => {
      if (!entityGenre) return [];
      return base44.entities.Album.filter({ genre: entityGenre }, '-created_date', 200);
    },
    enabled: !!entityGenre,
  });

  // Count this genre visit toward the listener's taste profile (drives the
  // home "For You" feed). Self-gates for guests.
  useEffect(() => {
    if (entityGenre) trackGenre(entityGenre);
  }, [entityGenre]);

  const albums = allItems.filter(i => !i.type || i.type === 'album');
  const singles = allItems.filter(i => i.type === 'single');

  const [duplicateError, setDuplicateError] = useState(null);

  // Singles have no automatic tracklist (that only runs for albums when opened),
  // so cascade through all 4 databases for a cover right at creation time when
  // the user didn't upload one — same guarantee albums get for tracklists.
  const fetchSingleCover = async (title, artist, genre) => {
    const result = await fetchCoverCascade(title, artist, genre);
    return result?.coverUrl ? await storeCoverImage(result.coverUrl) : null;
  };

  const addItem = useMutation({
    mutationFn: async (data) => {
      // Check for duplicate (same title + artist, case-insensitive)
      const exists = allItems.some(
        item =>
          item.title?.toLowerCase() === data.title?.toLowerCase() &&
          item.artist?.toLowerCase() === data.artist?.toLowerCase()
      );
      if (exists) throw new Error(`"${data.title}" by ${data.artist} is already in this genre.`);

      let cover_url = data.cover_url;
      if (data.type === 'single' && !cover_url) {
        cover_url = await fetchSingleCover(data.title, data.artist, entityGenre) || '';
      }

      return base44.entities.Album.create({ ...data, cover_url, genre: entityGenre || 'other', avg_rating: 0, review_count: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genre-albums', genreId] });
      setDuplicateError(null);
      setAddModal(null);
    },
    onError: (err) => setDuplicateError(err.message),
  });

  // Backfill real cover art for albums/singles that were added without one.
  // Covers are otherwise only fetched when a user opens the detail modal, so the
  // slider filled up with generic placeholder photography. This runs once per
  // page visit, searches the same four music databases, and updates each cover
  // in the cache as it resolves so real art appears progressively.
  const backfillStartedRef = useRef(false);
  useEffect(() => {
    if (backfillStartedRef.current) return;
    if (!allItems.length) return;
    const missing = allItems.filter(it => !it.cover_url);
    if (!missing.length) return;
    backfillStartedRef.current = true;
    let cancelled = false;
    (async () => {
      for (const item of missing) {
        if (cancelled) return;
        try {
          const result = await fetchCoverCascade(item.title, item.artist, entityGenre);
          if (result?.coverUrl) {
            const stored = await storeCoverImage(result.coverUrl);
            if (stored) {
              await base44.entities.Album.update(item.id, { cover_url: stored });
              queryClient.setQueryData(['genre-albums', genreId], (old) =>
                old ? old.map(it => (it.id === item.id ? { ...it, cover_url: stored } : it)) : old
              );
            }
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [allItems, genreId, entityGenre, queryClient]);

  if (!genre) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: PAPER.base, color: PAPER.muted }}>
        <p>{t('genre.notFound')}</p>
        <button onClick={() => navigate('/')} className="mt-4 underline">{t('genre.goHome')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-genre={genreId} style={{ background: PAPER.base }}>
      {/* Top bar — identical on every genre (fixed top layer) */}
      <div className="sticky top-0 z-40" style={{ background: 'rgba(230,221,201,0.92)', borderBottom: '1px solid rgba(26,24,21,0.1)' }}>
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate('/reviews')}
            className="flex items-center gap-2 text-xs font-semibold transition-colors hover:text-[#1a1815]"
            style={{ color: '#6b6358' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('common.back')}
          </button>
          <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: '#8a7e6f' }}>
            {gLabel(genreId, genre.label)} {t('genre.space')}
          </span>
          <div className="w-16" />
        </div>
      </div>

      {/* Sheet-music genre switcher — jump between any of the 16 genres or
          back to the Reviews home without retracing to the landing page. */}
      <ScoreGenreRail
        genres={GENRES}
        activeId={genreId}
        reviewsPath="/reviews"
      />

      <div className={`mx-auto px-6 pt-14 pb-24 ${skin.narrow ? 'max-w-3xl' : 'max-w-5xl'}`}>
        <GenreHero
          genreId={genreId}
          label={gLabel(genreId, genre.label)}
          tagline={gTagline(genreId, v.tagline)}
          description={gDesc(genreId, genre.desc)}
          skin={skin}
        />

        {isLoading ? (
          <div className="space-y-8 mt-8">
            {[0,1].map(s => (
              <div key={s}>
                <div className="h-4 w-24 rounded mb-4 animate-pulse" style={{ background: `${v.accent}20` }} />
                <div className="flex gap-4">
                  {[0,1,2,3].map(i => <div key={i} className="w-40 h-52 rounded-xl animate-pulse shrink-0" style={{ background: `${v.accent}12` }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <GenreEmptyState
            label={gLabel(genreId, genre.label)}
            accent={v.accent}
            onAdd={() => setAddModal('album')}
          />
        ) : (
          <div className="mt-8 space-y-2">
            {/* Rankings */}
            <GenreRankings items={allItems} v={v} />

            <div className="h-px my-6" style={{ background: `${v.accent}18` }} />

            {/* Albums slider */}
            <MusicSlider
              items={albums}
              v={v}
              kind="albums"
              onItemClick={handleItemClick}
              onAddClick={() => setAddModal('album')}
            />

            <div className="h-px my-6" style={{ background: `${v.accent}18` }} />

            {/* Singles slider */}
            <MusicSlider
              items={singles}
              v={v}
              kind="singles"
              onItemClick={handleItemClick}
              onAddClick={() => setAddModal('single')}
            />

            <GenreCommunity albumIds={allItems.map(item => item.id)} accent={v.accent} text={v.text} />
          </div>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {addModal && (
          <AddMusicModal
            v={v}
            type={addModal}
            onClose={() => { setAddModal(null); setDuplicateError(null); }}
            onSubmit={(data) => addItem.mutate(data)}
            isPending={addItem.isPending}
            errorMessage={duplicateError}
          />
        )}
      </AnimatePresence>

      {/* Item detail / reviews modal */}
      <AnimatePresence>
        {selectedItem && (
          <MusicItemDetail
            item={selectedItem}
            v={v}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}