import React from 'react';
import { useNavigate } from 'react-router-dom';
import Motif from '@/components/home/HomeMotif';
import HomeBackdrop from '@/components/home/HomeBackdrop';
import HomeTitle from '@/components/home/HomeTitle';
import { PenLine, Headphones, Users } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';
import HomeFeed from '@/components/HomeFeed';
import MusicTastePrompt from '@/components/MusicTastePrompt';
import PeopleAroundYou from '@/components/home/PeopleAroundYou';

// Three entries — staggered like a sound wave (middle dips), each crowned with
// a small, quiet musical motif instead of a plain hairline.
const OPTIONS = [
  { path: '/reviews',  icon: PenLine,   labelKey: 'home.reviews',   descKey: 'home.reviewsDesc',   motif: 'staff', lift: 'sm:-mt-2' },
  { path: '/podcasts', icon: Headphones, labelKey: 'home.podcasts',  descKey: 'home.podcastsDesc',  motif: 'wave',  lift: 'sm:mt-10' },
  { path: '/soulmate', icon: Users,     labelKey: 'home.soulmate',  descKey: 'home.soulmateDesc',  motif: 'slur',  lift: 'sm:-mt-2' },
];



export default function Home() {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <>
    <MusicTastePrompt />
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <HomeBackdrop />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-24 min-h-[calc(100vh-3.5rem)]">
        <HomeTitle />
        <div className="flex items-center gap-3 mt-5">
          <span className="h-px w-12" style={{ background: '#bf7a35', opacity: 0.6 }} />
          <span className="block"><Motif kind="note" /></span>
          <span className="h-px w-12" style={{ background: '#bf7a35', opacity: 0.6 }} />
        </div>
        <p className="mt-5 text-base md:text-lg max-w-xl text-center" style={{ color: '#5a534a' }}>
          {t('home.tagline')}
        </p>

        {/* Three paper cards — staggered like a sound wave */}
        <div className="mt-16 flex flex-col sm:flex-row sm:items-end justify-center gap-6 w-full max-w-4xl">
          {OPTIONS.map(({ path, icon: Icon, labelKey, descKey, motif, lift }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`group flex flex-col items-center text-center px-6 py-9 transition-all duration-300 hover:-translate-y-1 ${lift} flex-1`}
              style={{ '--card-accent': '#bf7a35', background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 12, boxShadow: '0 2px 14px rgba(120,100,80,0.06)' }}
            >
              <div className="mb-5 opacity-70 transition-opacity group-hover:opacity-100">
                <Motif kind={motif} />
              </div>
              <Icon className="w-7 h-7 mb-4 transition-colors text-[#8a7e6f] group-hover:text-[color:var(--card-accent)]" />
              <p className="font-playfair italic text-xl mb-2" style={{ color: '#1a1815' }}>{t(labelKey)}</p>
              <p className="text-xs leading-relaxed max-w-[220px]" style={{ color: '#6b6358' }}>{t(descKey)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
    <PeopleAroundYou />
    <HomeFeed />
    </>
  );
}