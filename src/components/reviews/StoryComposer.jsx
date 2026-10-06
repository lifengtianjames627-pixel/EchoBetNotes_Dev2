import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, ListMusic, Plus, Trash2, Send } from 'lucide-react';
import usePublishStoryReview from '@/features/reviews/queries/usePublishStoryReview';
import PublishFeedback from '@/features/reviews/components/PublishFeedback';
import { GENRES } from '@/lib/genreConfig';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import { useContentModeration } from '@/shared/hooks/useContentModeration';

// Compose a journey story or a genre roundup. Reuses the same Review entity
// and the same AI moderation hook as album reviews, so stories pass through
// the moderation queue identically.
export default function StoryComposer({ user, onClose }) {
  const { t } = useLang();
  const { localizedGenres } = useGenreText();
  const { moderate } = useContentModeration();

  const [kind, setKind] = useState('journey_story');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [content, setContent] = useState('');
  const [albums, setAlbums] = useState([{ title: '', artist: '', cover_url: '', blurb: '' }]);

  const isRoundup = kind === 'genre_roundup';

  const submit = usePublishStoryReview({
    draft: { kind, title, genre, heroImage, content, albums },
    user, moderate, onSuccess: onClose,
  });

  const canSubmit = title.trim() && content.trim() && (!isRoundup || albums.some(a => a.title.trim()));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        style={{ background: 'rgba(26,24,21,0.55)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="relative w-full max-w-2xl my-4 rounded-2xl overflow-hidden"
          style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 10px 50px rgba(60,50,40,0.25)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e0d8c8', background: '#f1ebdd' }}>
            <p className="font-playfair italic text-lg" style={{ color: '#1a1815' }}>{t('reviews.writeStory')}</p>
            <button onClick={onClose} style={{ color: '#6b6358' }}><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Kind toggle */}
            <div className="flex gap-2">
              {[
                { id: 'journey_story', label: t('reviews.kind.journey'), icon: Compass },
                { id: 'genre_roundup', label: t('reviews.kind.roundup'), icon: ListMusic },
              ].map(o => (
                <button key={o.id} onClick={() => setKind(o.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all"
                  style={kind === o.id
                    ? { background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }
                    : { background: '#faf8f2', color: '#6b6358', border: '1px solid #e0d8c8' }}>
                  <o.icon className="w-3.5 h-3.5" /> {o.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t('story.titlePlaceholder')}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-playfair italic outline-none"
              style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />

            {/* Genre + hero image */}
            <div className="grid grid-cols-2 gap-3">
              <select value={genre} onChange={e => setGenre(e.target.value)}
                className="px-3 py-2.5 rounded-lg text-xs outline-none"
                style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }}>
                <option value="">{t('story.genre')}…</option>
                {(localizedGenres || GENRES).map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
              <input value={heroImage} onChange={e => setHeroImage(e.target.value)}
                placeholder={t('story.heroImage')}
                className="px-3 py-2.5 rounded-lg text-xs outline-none"
                style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />
            </div>

            {/* Content */}
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
              placeholder={isRoundup ? t('story.roundupPlaceholder') : t('story.journeyPlaceholder')}
              className="w-full px-3 py-2.5 rounded-lg text-sm leading-relaxed outline-none resize-y"
              style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />

            {/* Featured albums (roundup only) */}
            {isRoundup && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#bf7a35' }}>{t('reviews.kind.roundup')}</p>
                {albums.map((a, i) => (
                  <div key={i} className="p-3 rounded-lg space-y-2" style={{ background: '#f5f2ea', border: '1px solid #e6ddc9' }}>
                    <div className="flex gap-2">
                      <input value={a.title} onChange={e => { const n = [...albums]; n[i].title = e.target.value; setAlbums(n); }}
                        placeholder={t('story.albumTitle')}
                        className="flex-1 px-2.5 py-2 rounded-md text-xs outline-none" style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />
                      <input value={a.artist} onChange={e => { const n = [...albums]; n[i].artist = e.target.value; setAlbums(n); }}
                        placeholder={t('story.albumArtist')}
                        className="flex-1 px-2.5 py-2 rounded-md text-xs outline-none" style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />
                      {albums.length > 1 && (
                        <button onClick={() => setAlbums(albums.filter((_, j) => j !== i))}
                          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center" style={{ color: '#9c3b33' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input value={a.cover_url} onChange={e => { const n = [...albums]; n[i].cover_url = e.target.value; setAlbums(n); }}
                      placeholder={t('story.albumCover')}
                      className="w-full px-2.5 py-2 rounded-md text-xs outline-none" style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />
                    <textarea value={a.blurb} onChange={e => { const n = [...albums]; n[i].blurb = e.target.value; setAlbums(n); }}
                      rows={2} placeholder={t('story.albumBlurb')}
                      className="w-full px-2.5 py-2 rounded-md text-xs outline-none resize-y" style={{ background: '#fff', border: '1px solid #e0d8c8', color: '#1a1815' }} />
                  </div>
                ))}
                <button onClick={() => setAlbums([...albums, { title: '', artist: '', cover_url: '', blurb: '' }])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
                  <Plus className="w-3.5 h-3.5" /> {t('story.addAlbum')}
                </button>
              </div>
            )}

            <PublishFeedback pending={submit.isPending} error={submit.error} />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid #e0d8c8', background: '#f5f2ea' }}>
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: '#6b6358' }}>{t('common.back')}</button>
            <button disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: '#1a1815', color: '#faf8f2', opacity: !canSubmit || submit.isPending ? 0.5 : 1 }}>
              <Send className="w-3.5 h-3.5" /> {t('story.publish')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}