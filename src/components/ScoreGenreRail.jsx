import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// A sheet-music styled genre switcher: five staff lines run across the strip,
// each genre sits on the staff as a note (alternating pitch so the row reads
// like a little melody), and the active genre is a filled notehead while the
// rest stay hollow. A treble clef opens the staff; the first "note" is the
// Reviews home page.
//
// Notes are deterministic per genre id so a genre always sits on the same
// line/space — stable as you switch between pages.
const STAFF_LINES = [16, 26, 36, 46, 56]; // y positions of the 5 lines
const PITCHES = [56, 46, 36, 26, 16, 31, 41, 21]; // line/space positions cycled for melody
const INK = '#bf7a35';

function pitchFor(id) {
  // stable pseudo-random index into PITCHES
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PITCHES[h % PITCHES.length];
}

function Note({ active, y, label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center shrink-0 px-2.5 transition-transform hover:-translate-y-0.5"
      style={{ width: 64 }}
      title={label}
    >
      <div className="relative" style={{ height: 62 }}>
        {/* stem */}
        <span
          className="absolute"
          style={{
            left: 'calc(50% + 4px)',
            top: `${y - 30}px`,
            height: 30,
            width: 1.4,
            background: INK,
            opacity: active ? 0.9 : 0.5,
          }}
        />
        {/* notehead */}
        <span
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: `${y - 4}px`,
            width: 11,
            height: 8,
            borderRadius: '50%',
            transform: 'translateX(-50%) rotate(-20deg)',
            background: active ? INK : 'transparent',
            border: `1.4px solid ${INK}`,
            opacity: active ? 1 : 0.55,
            boxShadow: active ? `0 0 0 3px ${INK}1a` : 'none',
          }}
        />
      </div>
      <span
        className="text-[10px] font-semibold leading-tight text-center mt-1 transition-colors"
        style={{ color: active ? '#1a1815' : '#8a7e6f', whiteSpace: 'nowrap' }}
      >
        {label}
      </span>
    </button>
  );
}

function Clef() {
  return (
    <svg width="20" height="62" viewBox="0 0 20 62" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
      <path d="M10 6 C 6 8 4 13 4 18 C 4 24 9 26 12 23 C 15 20 13 16 10 17 C 8 18 8 22 11 23 C 16 25 18 29 18 35 C 18 40 14 43 10 43 C 7 43 5 41 6 39 C 7 37 10 37 11 39 C 12 41 10 42 8 41" />
      <path d="M10 6 V 40" />
      <circle cx="10" cy="42" r="1.8" fill={INK} stroke="none" opacity="0.7" />
    </svg>
  );
}

export default function ScoreGenreRail({ genres, activeId, reviewsPath = '/reviews' }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll the active note into view when the genre changes.
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const el = activeRef.current;
      const container = scrollRef.current;
      const elLeft = el.offsetLeft;
      const elRight = elLeft + el.offsetWidth;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;
      if (elLeft < viewLeft + 40 || elRight > viewRight - 40) {
        container.scrollTo({ left: elLeft - container.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
      }
    }
  }, [activeId]);

  return (
    <section
      className="sticky top-12 z-30 border-b"
      style={{ background: '#f5efe2', borderColor: 'rgba(26,24,21,0.08)' }}
    >
      {/* Staff lines spanning the full width */}
      <div className="relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-[62px] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 62">
          {STAFF_LINES.map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke={INK} strokeWidth="0.3" opacity="0.35" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        {/* Scrollable notes */}
        <div
          ref={scrollRef}
          className="relative flex items-start gap-0 overflow-x-auto px-3 pt-1 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex items-center shrink-0 px-1" style={{ height: 62 }}>
            <Clef />
          </div>

          {/* Reviews home note — sits on the bottom line like a home key */}
          <div ref={activeId === '__reviews' ? activeRef : null}>
            <Note
              active={activeId === '__reviews'}
              y={STAFF_LINES[4]}
              label="Reviews"
              onClick={() => navigate(reviewsPath)}
            />
          </div>

          {genres.map(g => (
            <div key={g.id} ref={g.id === activeId ? activeRef : null}>
              <Note
                active={g.id === activeId}
                y={pitchFor(g.id)}
                label={g.label}
                onClick={() => navigate(`/genre/${g.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hide scrollbar (webkit) */}
      <style>{`.score-rail::-webkit-scrollbar{display:none}`}</style>
    </section>
  );
}