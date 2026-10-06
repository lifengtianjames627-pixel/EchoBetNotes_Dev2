import React from 'react';

// Beige filter bar — the "spine" between the blurred header and the paper
// content. Genre pills with no fill; the selected one gets a black underline.
export default function GenreRail({ genres, onSelect, activeId }) {
  return (
    <section style={{ background: '#e6ddc9' }} className="border-y">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold mr-3 shrink-0" style={{ color: '#8a7e6f' }}>Browse</span>
        {genres.map(genre => {
          const active = activeId === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => onSelect(genre.id)}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={active ? { color: '#1a1815', borderBottom: '2px solid #1a1815' } : { color: '#6b6358' }}
            >
              {genre.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}