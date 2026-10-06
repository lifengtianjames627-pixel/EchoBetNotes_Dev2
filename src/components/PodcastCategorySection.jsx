import React from 'react';
import { motion } from 'framer-motion';
import { Mic2, Plus, Clock, Headphones } from 'lucide-react';
import { useAuthed } from '@/hooks/useAuthed';
import { useLang } from '@/i18n/LanguageContext';

function EpisodeCard({ ep, category, featured, index }) {
  const { t } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative flex gap-4 p-4 rounded-2xl"
      style={{
        background: 'rgba(12,15,35,0.6)',
        border: `1px solid ${category.accent}1f`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* accent rail */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
        style={{ background: `linear-gradient(${category.accent}, transparent)` }} />
      <div className={`${featured ? 'w-28 h-28' : 'w-16 h-16'} rounded-xl overflow-hidden shrink-0 flex items-center justify-center`}
        style={{ background: `${category.accent}14` }}>
        {ep.cover_url
          ? <img src={ep.cover_url} alt={ep.title} className="w-full h-full object-cover" />
          : <Mic2 className="w-6 h-6" style={{ color: category.accent, opacity: 0.5 }} />}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <p className={`font-playfair ${featured ? 'text-base' : 'text-sm'} font-semibold leading-snug`} style={{ color: 'rgba(230,232,255,0.95)' }}>{ep.title}</p>
        <p className="text-[11px] mt-0.5 uppercase tracking-wider truncate" style={{ color: `${category.accent}bb` }}>{ep.host_name}</p>
        {ep.description && <p className={`text-xs mt-1.5 ${featured ? 'line-clamp-3' : 'line-clamp-2'}`} style={{ color: 'rgba(140,155,210,0.55)' }}>{ep.description}</p>}
        <div className="flex items-center gap-3 mt-auto pt-2">
          {ep.duration_minutes > 0 && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(140,155,210,0.4)' }}>
              <Clock className="w-3 h-3" /> {ep.duration_minutes} {t('pod.min')}
            </span>
          )}
        </div>
        {ep.audio_url && <audio controls src={ep.audio_url} className="w-full mt-2" style={{ height: 32 }} />}
      </div>
    </motion.div>
  );
}

export default function PodcastCategorySection({ category, episodes, onAddClick, index }) {
  const { t } = useLang();
  const { authed, login } = useAuthed();
  const [featured, ...rest] = episodes;
  const handleAdd = authed ? onAddClick : login;

  return (
    <div className="relative">
      {/* ghost index */}
      <div className="absolute -top-8 right-0 select-none pointer-events-none font-playfair italic"
        style={{ fontSize: 'clamp(5rem, 13vw, 9rem)', color: `${category.accent}0a`, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {String(index).padStart(2, '0')}
      </div>

      {/* header */}
      <div className="relative flex items-end justify-between mb-7 gap-4">
        <div className="max-w-xl">
          <span className="text-[10px] uppercase tracking-[0.24em] font-medium block mb-2" style={{ color: `${category.accent}99` }}>
            {String(index).padStart(2, '0')} · {t(`pod.cat.${category.id}.tagline`)}
          </span>
          <h2 className="font-playfair italic text-3xl leading-none" style={{ color: 'rgba(230,232,255,0.95)' }}>
            {t(`pod.cat.${category.id}.label`)}
          </h2>
          <p className="text-xs mt-3 leading-relaxed max-w-md" style={{ color: 'rgba(140,155,210,0.55)' }}>{t(`pod.cat.${category.id}.desc`)}</p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full shrink-0 transition-all hover:opacity-80"
          style={{ color: category.accent, border: `1px solid ${category.accent}40` }}>
          <Plus className="w-3 h-3" /> {authed ? t('genre.add') : t('nav.login')}
        </button>
      </div>

      {episodes.length === 0 ? (
        <button onClick={handleAdd}
          className="w-full flex flex-col items-center justify-center py-12 rounded-2xl transition-all hover:opacity-80"
          style={{ borderTop: `1px solid ${category.accent}1a`, borderBottom: `1px solid ${category.accent}1a`, background: 'rgba(12,15,35,0.4)' }}>
          <Headphones className="w-7 h-7 mb-3" style={{ color: category.accent, opacity: 0.3 }} />
          <p className="text-xs font-playfair italic" style={{ color: 'rgba(140,155,210,0.45)' }}>{t('pod.empty')}</p>
        </button>
      ) : (
        <div className="space-y-4">
          {featured && <EpisodeCard ep={featured} category={category} featured index={0} />}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rest.map((ep, i) => <EpisodeCard key={ep.id} ep={ep} category={category} index={i + 1} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}