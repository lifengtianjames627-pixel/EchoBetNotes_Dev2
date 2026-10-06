import React from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import SafetyNotice from '@/components/soulmate/SafetyNotice';

// Hero + filter panel — paper editorial. Photo with warm paper scrim (not dark),
// black print buttons, ochre location accents. All controls kept as-is.
export default function SoulmateHero({ t, kinds, kind, setKind, instruments, role, setRole, search, setSearch, onCreate }) {
  return (
    <>
      <section className="relative min-h-[340px] overflow-hidden" style={{ border: '1px solid #e6ddc9' }}>
        <img
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=85"
          alt="Students rehearsing together"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* warm paper scrim — photo fades into the page like a journal spread */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, hsl(var(--background) / 0.96) 0%, hsl(var(--background) / 0.88) 60%, hsl(var(--background) / 0.72) 100%)' }} />
        <div className="relative max-w-2xl p-6 sm:p-9 flex flex-col justify-end min-h-[340px]">
          <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: '#bf7a35' }}>Local music community</p>
          <h1 className="mt-3 font-playfair text-4xl italic leading-none sm:text-5xl" style={{ color: '#1a1815' }}>{t('home.soulmate')}</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed" style={{ color: '#5a534a' }}>{t('sm.subtitle')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors" style={{ background: '#1a1815', color: '#faf8f2' }}>
              <Plus className="h-4 w-4" /> {t('sm.post')}
            </button>
            <span className="px-4 py-2.5 text-xs flex items-center" style={{ background: '#faf8f2', color: '#6b6358', border: '1px solid #e6ddc9' }}>In-app chat only</span>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_290px]">
        {/* filter panel — paper card */}
        <div className="p-4" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#8a7e6f' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('sm.search')}
              className="w-full py-3 pl-10 pr-4 text-sm outline-none"
              style={{ background: '#f3efe6', color: '#1a1815', border: '1px solid #e0d8c8' }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {kinds.map(item => (
              <button
                key={item.id}
                onClick={() => setKind(item.id)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={kind === item.id
                  ? { background: '#1a1815', color: '#faf8f2' }
                  : { color: '#6b6358', border: '1px solid #e0d8c8' }}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {instruments.map(item => (
              <button
                key={item}
                onClick={() => setRole(role === item ? null : item)}
                className="px-2.5 py-1 text-[11px] transition-colors"
                style={role === item
                  ? { background: '#bf7a35', color: '#faf8f2' }
                  : { color: '#8a7e6f', border: '1px solid #e0d8c8' }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <SafetyNotice />
      </div>

      <p className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#bf7a35' }}>
        <SlidersHorizontal className="h-3.5 w-3.5" /> Open calls nearby
      </p>
    </>
  );
}