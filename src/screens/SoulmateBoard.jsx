import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PosterCard from '@/components/soulmate/PosterCard';
import CreatePostModal, { INSTRUMENTS } from '@/components/soulmate/CreatePostModal';
import SoulmateHero from '@/components/soulmate/SoulmateHero';
import { useLang } from '@/i18n/LanguageContext';
import useRecruitPosts from '@/features/soulmate/queries/useRecruitPosts';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';

const KINDS = [{ id: 'all', labelKey: 'sm.kind.all' }, { id: 'band', labelKey: 'sm.kind.band' }, { id: 'musician', labelKey: 'sm.kind.musician' }];

export default function SoulmateBoard() {
  const { t, lang } = useLang();
  const copy = recruitCopy(lang);
  const [kind, setKind] = useState('all');
  const [role, setRole] = useState(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: allPosts = [], isLoading, error, refetch } = useRecruitPosts(currentUser);

  const posts = allPosts
    .filter(p => !p.moderation_status || p.moderation_status === 'approved')
    .filter(p => kind === 'all' || p.kind === kind)
    .filter(p => !role || p.looking_for?.includes(role) || p.i_play?.includes(role))
    .filter(p => !search.trim() || [p.title, p.band_name, p.city, p.school, p.influences, p.description, ...(p.genre_tags || [])]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-16">
        <SoulmateHero
          t={t}
          kinds={KINDS}
          kind={kind}
          setKind={setKind}
          instruments={INSTRUMENTS}
          role={role}
          setRole={setRole}
          search={search}
          setSearch={setSearch}
          onCreate={() => setCreating(true)}
        />

        {error ? <div role="alert" className="py-12 text-center text-destructive"><p>{copy.failed}</p><button className="mt-3 underline" onClick={() => refetch()}>{copy.retry}</button></div> : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm" style={{ color: '#8a7e6f' }}>
            <Loader2 className="h-4 w-4 animate-spin" /> {t('sm.loading')}
          </div>
        ) : posts.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PosterCard key={post.id} post={post} currentUser={currentUser} index={index} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <Users className="mx-auto mb-3 h-9 w-9" style={{ color: 'rgba(191,122,53,0.4)' }} />
            <p className="text-sm" style={{ color: '#6b6358' }}>{t('sm.empty')}</p>
            <p className="mt-1 text-xs" style={{ color: '#8a7e6f' }}>{t('sm.emptyHint')}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && currentUser && <CreatePostModal currentUser={currentUser} onClose={() => setCreating(false)} />}
      </AnimatePresence>
    </div>
  );
}