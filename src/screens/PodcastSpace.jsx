import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mic2, Plus, Clock, Headphones } from 'lucide-react';
import { PODCAST_CATEGORY_MAP } from '@/lib/podcastConfig';
import AddPodcastModal from '@/components/AddPodcastModal';
import { useAuthed } from '@/hooks/useAuthed';
import { useLang } from '@/i18n/LanguageContext';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';

export default function PodcastSpace() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const { authed, login } = useAuthed();
  const category = PODCAST_CATEGORY_MAP[categoryId];

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-created_date', 300),
  });

  const addEpisode = useMutation({
    mutationFn: (data) => base44.entities.Podcast.create({ ...data, host_email: currentUser?.email || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setAddOpen(false);
    },
  });

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f3efe6', color: '#6b6358' }}>
        <p className="font-playfair italic text-xl mb-4">Unknown series</p>
        <button onClick={() => navigate('/podcasts')} className="text-sm hover:underline" style={{ color: '#bf7a35' }}>← Back to staff</button>
      </div>
    );
  }

  const mine = episodes.filter(e => e.category === category.id);
  const handleAdd = authed ? () => setAddOpen(true) : login;

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      {/* beige back bar */}
      <div className="sticky top-0 z-40" style={{ background: 'rgba(230,221,201,0.88)', borderBottom: '1px solid rgba(26,24,21,0.1)' }}>
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center">
          <button onClick={() => navigate('/podcasts')} className="flex items-center gap-2 text-xs font-semibold transition-colors hover:text-[#1a1815]" style={{ color: '#6b6358' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Staff
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
        {/* hero */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.28em] font-semibold block mb-3" style={{ color: '#bf7a35' }}>
            {t(`pod.cat.${category.id}.tagline`)}
          </span>
          <h1 className="font-playfair italic leading-none mb-5" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', color: '#1a1815' }}>
            {t(`pod.cat.${category.id}.label`)}
          </h1>
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: '#6b6358' }}>{t(`pod.cat.${category.id}.desc`)}</p>
          <button onClick={handleAdd} className="mt-6 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors hover:bg-[#1a1815] hover:text-[#faf8f2]" style={{ color: '#1a1815', border: '1px solid #1a1815' }}>
            <Plus className="w-3 h-3" /> {authed ? t('genre.add') : t('nav.login')}
          </button>
        </motion.div>

        {/* episodes */}
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map(s => <div key={s} className="h-24 animate-pulse" style={{ background: '#e6ddc9' }} />)}
          </div>
        ) : mine.length === 0 ? (
          <button onClick={handleAdd} className="w-full flex flex-col items-center justify-center py-16 transition-colors hover:bg-[#faf8f2]" style={{ borderTop: '1px solid #e6ddc9', borderBottom: '1px solid #e6ddc9' }}>
            <Headphones className="w-8 h-8 mb-3" style={{ color: '#bf7a35', opacity: 0.3 }} />
            <p className="text-sm font-playfair italic" style={{ color: '#8a7e6f' }}>{t('pod.empty')}</p>
          </button>
        ) : (
          <div className="space-y-0">
            {mine.map((ep, i) => (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 py-5"
                style={{ borderTop: i === 0 ? '1px solid #e6ddc9' : '1px dashed #e0d8c8' }}
              >
                <div className="w-20 h-20 shrink-0 overflow-hidden flex items-center justify-center" style={{ background: '#e6ddc9' }}>
                  {ep.cover_url ? <img src={ep.cover_url} alt={ep.title} className="w-full h-full object-cover" /> : <Mic2 className="w-6 h-6" style={{ color: '#bf7a35', opacity: 0.5 }} />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="font-playfair text-base font-semibold leading-snug" style={{ color: '#1a1815' }}>{ep.title}</p>
                  {ep.host_email ? (
                    <button
                      onClick={() => ep.host_email !== currentUser?.email && openPrivateChat(ep.host_email, ep.host_name)}
                      className="text-[11px] mt-0.5 uppercase tracking-wider truncate block hover:underline text-left"
                      style={{ color: '#bf7a35' }}
                      title="Message this host"
                    >
                      {ep.host_name}
                    </button>
                  ) : (
                    <p className="text-[11px] mt-0.5 uppercase tracking-wider truncate" style={{ color: '#bf7a35' }}>{ep.host_name}</p>
                  )}
                  {ep.description && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: '#6b6358' }}>{ep.description}</p>}
                  <div className="flex items-center gap-3 mt-auto pt-2">
                    {ep.duration_minutes > 0 && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: '#8a7e6f' }}><Clock className="w-3 h-3" /> {ep.duration_minutes} {t('pod.min')}</span>
                    )}
                  </div>
                  {ep.audio_url && <audio controls src={ep.audio_url} className="w-full mt-2" style={{ height: 32 }} />}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <AddPodcastModal defaultCategory={category.id} onClose={() => setAddOpen(false)} onSubmit={(data) => addEpisode.mutate(data)} isPending={addEpisode.isPending} />
        )}
      </AnimatePresence>
    </div>
  );
}