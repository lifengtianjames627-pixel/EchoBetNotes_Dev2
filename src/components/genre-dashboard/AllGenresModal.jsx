import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { BUBBLE_COLORS, GENRE_ICONS } from '@/lib/genreVisuals';
import { useLang } from '@/i18n/LanguageContext';

export default function AllGenresModal({ genres, onClose, onSelect }) {
  const { t } = useLang();
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-5"
          style={{ background: 'rgba(10,12,30,0.98)', border: '1px solid rgba(124,111,255,0.2)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: 'rgba(220,225,255,0.95)' }}>{t('common.allGenres')}</h3>
            <button onClick={onClose} style={{ color: 'rgba(160,175,220,0.5)' }}>
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {genres.map((genre, i) => {
              const c = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
              const IconSvg = GENRE_ICONS[genre.id] || GENRE_ICONS['electronic'];
              return (
                <button
                  key={genre.id}
                  onClick={() => onSelect(genre.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02] text-left"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}30` }}
                >
                  <div className="shrink-0" style={{ width: 24, height: 24, filter: `drop-shadow(0 0 5px ${c.border})` }}>
                    {IconSvg(c.border)}
                  </div>
                  <span className="text-sm font-semibold flex-1" style={{ color: c.text }}>{genre.label}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(160,175,220,0.3)' }} />
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}