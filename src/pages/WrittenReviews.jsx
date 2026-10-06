import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PenLine } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { GENRES } from '@/lib/genreConfig';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import { useAuthed } from '@/shared/identity';
import ReviewLead from '@/components/reviews/ReviewLead';
import ReviewFeed from '@/components/reviews/ReviewFeed';
import GenreRail from '@/components/reviews/GenreRail';
import StoryCard from '@/components/reviews/StoryCard';
import StoryDetailModal from '@/components/reviews/StoryDetailModal';
import StoryComposer from '@/components/reviews/StoryComposer';
import useReviewsBoard from '@/features/reviews/queries/useReviewsBoard';
import FeedQueryState from '@/components/reviews/FeedQueryState';
import PopularAlbums from '@/components/reviews/PopularAlbums';
import boardCopy from '@/components/reviews/boardCopy';

export default function WrittenReviews() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { localizedGenres } = useGenreText();
  const { authed, login } = useAuthed();
  const [tab, setTab] = useState('albums');
  const [openStory, setOpenStory] = useState(null);
  const [composing, setComposing] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), enabled: authed });
  const copy = boardCopy(useLang().lang);
  const { board, albumReviews, stories, roundups, isLoading, isError, refetch } = useReviewsBoard();

  const openAlbum = id => navigate(`/album/${id}`);

  const tabs = [
    { id: 'albums', label: t('reviews.tab.albums'), count: albumReviews.length },
    { id: 'stories', label: t('reviews.tab.stories'), count: stories.length },
    { id: 'roundups', label: t('reviews.tab.roundups'), count: roundups.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      {/* Layer 1 — blurred ambient header */}
      <div className="relative h-[230px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=80"
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{ filter: 'blur(24px) saturate(0.55) brightness(1.05)', transform: 'scale(1.12)' }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(243,239,230,0.62)' }} />
        <div className="absolute inset-0 flex items-end pb-7 px-6 sm:px-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: '#bf7a35' }}>Listening, closely</p>
            <h1 className="mt-2 font-playfair text-5xl italic sm:text-6xl" style={{ color: '#1a1815' }}>Written Reviews</h1>
          </div>
        </div>
      </div>

      {/* Layer 2 — beige genre filter bar */}
      <GenreRail genres={localizedGenres || GENRES} onSelect={id => navigate(`/genre/${id}`)} />

      {/* Layer 3 — cream paper content sheet */}
      <div className="mx-auto max-w-5xl my-10 px-8 sm:px-12 py-10" style={{ background: '#faf8f2', border: '1px solid #e6ddc9', boxShadow: '0 2px 20px rgba(120,100,80,0.06)' }}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#6b6358' }}>
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </button>
          <button
            onClick={() => (authed ? setComposing(true) : login())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: '#1a1815', color: '#faf8f2' }}
          >
            <PenLine className="w-3.5 h-3.5" /> {t('reviews.writeStory')}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === tb.id
                ? { background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }
                : { background: '#faf8f2', color: '#6b6358', border: '1px solid #e0d8c8' }}>
              {tb.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(191,122,53,0.15)', color: '#8a5a20' }}>{tb.count}</span>
            </button>
          ))}
        </div>

        <main className="mt-8">
          {isLoading ? <FeedQueryState loading /> : isError ? <FeedQueryState retry={refetch} /> : <>
          {tab === 'albums' && (
            <>
              {/* 1 — Editors' picks: the reviews an admin has liked */}
              {(board?.editorsPicks?.length > 0) && (
                <>
                  <ReviewLead review={board.editorsPicks[0]} onOpen={openAlbum} />
                  {board.editorsPicks.length > 1 && (
                    <ReviewFeed reviews={board.editorsPicks.slice(1, 10)} onOpen={openAlbum} title={copy.picks} hint={copy.picksHint} />
                  )}
                </>
              )}

              {/* 2 — Popular albums by views (0.3) + review likes (0.7) */}
              <PopularAlbums albums={board?.popularAlbums || []} />

              {/* 3 — Newest reviews last */}
              <div className="mt-14">
                <ReviewFeed reviews={board?.recentReviews || albumReviews.slice(0, 9)} onOpen={openAlbum} title={copy.recent} />
              </div>
            </>
          )}

          {tab === 'stories' && (
            stories.length === 0 ? (
              <p className="py-16 text-center text-sm" style={{ color: '#8a7e6f' }}>{t('story.empty')}</p>
            ) : (
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map(r => <StoryCard key={r.id} review={r} onOpen={setOpenStory} />)}
              </div>
            )
          )}

          {tab === 'roundups' && (
            roundups.length === 0 ? (
              <p className="py-16 text-center text-sm" style={{ color: '#8a7e6f' }}>{t('story.emptyRoundups')}</p>
            ) : (
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {roundups.map(r => <StoryCard key={r.id} review={r} onOpen={setOpenStory} />)}
              </div>
            )
          )}
          </>}
        </main>
      </div>

      {openStory && <StoryDetailModal story={openStory} onClose={() => setOpenStory(null)} />}
      {composing && <StoryComposer user={user} onClose={() => setComposing(false)} />}
    </div>
  );
}