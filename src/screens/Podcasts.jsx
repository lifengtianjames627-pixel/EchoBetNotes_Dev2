import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Headphones, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { PODCAST_CATEGORIES } from '@/lib/podcastConfig';
import PodcastEditorialStrip from '@/components/podcasts/PodcastEditorialStrip';
import { useLang } from '@/i18n/LanguageContext';

function fmtTotal(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}min` : `${m}min`;
}

export default function Podcasts() {
  const navigate = useNavigate();
  const { t } = useLang();
  const trackRef = useRef(null);

  const { data: episodes = [] } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-created_date', 300),
  });

  const metaFor = (id) => {
    const mine = episodes.filter(e => e.category === id);
    const covers = mine.map(e => e.cover_url).filter(Boolean);
    const total = mine.reduce((s, e) => s + (e.duration_minutes || 0), 0);
    return { count: mine.length, covers, total };
  };

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (320 + 16), behavior: 'smooth' });
  };

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
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: '#bf7a35' }}>{t('pod.subtitle')}</p>
            <h1 className="mt-2 font-playfair text-5xl italic sm:text-6xl" style={{ color: '#1a1815' }}>Music Podcasts</h1>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        {/* Section header */}
        <div className="flex items-end justify-between gap-4 mb-7">
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5" style={{ color: '#bf7a35' }} />
            <h2 className="font-playfair text-2xl italic" style={{ color: '#1a1815' }}>Series</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => scrollBy(-1)} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#e6ddc9]" style={{ border: '1px solid #d8cfb8', color: '#1a1815' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scrollBy(1)} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#e6ddc9]" style={{ border: '1px solid #d8cfb8', color: '#1a1815' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10" style={{ background: 'linear-gradient(to left, #f3efe6 30%, transparent)' }} />
          <div ref={trackRef} className="overflow-x-auto no-scrollbar pb-2" style={{ scrollbarWidth: 'none', scrollSnapType: 'x proximity' }}>
            <div className="flex gap-4 pr-6" style={{ width: 'max-content' }}>
              {PODCAST_CATEGORIES.map((cat, i) => {
                const { count, covers, total } = metaFor(cat.id);
                const front = covers[0];
                const thumbs = covers.slice(1, 4);
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/podcasts/${cat.id}`)}
                    className="group shrink-0 text-left w-[300px] transition-colors"
                    style={{ background: '#faf8f2', border: '1px solid #e6ddc9', scrollSnapAlign: 'start' }}
                  >
                    {/* visual */}
                    <div className="relative flex gap-1 p-2" style={{ height: 168 }}>
                      <div className="relative flex-1 overflow-hidden" style={{ background: '#e6ddc9' }}>
                        {front ? (
                          <img src={front} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center relative">
                            <Headphones className="w-8 h-8" style={{ color: 'rgba(191,122,53,0.25)' }} />
                            <span className="absolute top-2 right-3 font-playfair italic" style={{ fontSize: 56, color: 'rgba(191,122,53,0.1)', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-[#bf7a35] group-hover:text-[#faf8f2]" style={{ background: '#1a1815', color: '#faf8f2' }}>
                          <Play className="w-4 h-4" fill="currentColor" style={{ marginLeft: 1 }} />
                        </div>
                        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: '#bf7a35', opacity: 0.6 }} />
                      </div>
                      {thumbs.length > 0 && (
                        <div className="w-14 flex flex-col gap-1 py-0.5">
                          {thumbs.map((c, ti) => (
                            <div key={ti} className="flex-1 overflow-hidden" style={{ background: '#e6ddc9' }}>
                              <img src={c} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* info */}
                    <div className="px-4 pb-4 pt-1">
                      <span className="text-[10px] uppercase tracking-[0.22em] font-semibold block mb-1.5" style={{ color: '#bf7a35' }}>
                        {String(i + 1).padStart(2, '0')} · {t(`pod.cat.${cat.id}.tagline`)}
                      </span>
                      <h3 className="font-playfair italic text-xl leading-tight mb-1.5" style={{ color: '#1a1815' }}>
                        {t(`pod.cat.${cat.id}.label`)}
                      </h3>
                      <p className="text-[11px] mb-2" style={{ color: '#8a7e6f' }}>
                        {count > 0 ? `${count} ${count === 1 ? 'episode' : 'episodes'}${fmtTotal(total) ? ' · ' + fmtTotal(total) : ''}` : 'No episodes yet'}
                      </p>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6b6358' }}>
                        {t(`pod.cat.${cat.id}.desc`)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <PodcastEditorialStrip />
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}