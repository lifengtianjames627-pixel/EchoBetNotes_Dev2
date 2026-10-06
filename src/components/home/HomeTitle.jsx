import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import WavyStaff from '@/components/home/WavyStaff';

const TITLE = 'Echo Between Notes';
const WORDS = TITLE.split(' ').map((word, index, words) => ({
  word, offset: words.slice(0, index).reduce((sum, item) => sum + item.length + 1, 0),
}));
const OFFSETS = [...TITLE].map((_, i) => Math.round(Math.sin(i / 2.1) * 13));

export default function HomeTitle() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative inline-flex max-w-full items-end gap-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true"><WavyStaff /></div>
      <span className="hidden sm:block mb-2 relative z-10 shrink-0" aria-hidden="true">
        <svg width="30" height="60" viewBox="0 0 30 60" fill="none" stroke="#bf7a35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
          <path d="M15 6 C 9 9 6 16 6 23 C 6 31 13 34 16 30 C 19 26 17 21 13 22 C 10 23 10 28 14 30 C 20 33 25 38 25 46 C 25 53 19 57 13 57 C 9 57 7 54 8 51 C 9 48 13 48 14 51 C 15 54 12 55 10 54" />
          <path d="M15 6 V 52" /><circle cx="15" cy="55" r="2.4" fill="#bf7a35" stroke="none" opacity="0.7" />
        </svg>
      </span>
      <h1 aria-label={TITLE} className="relative z-10 min-w-0 font-playfair italic leading-none text-center text-[clamp(2rem,8vw,6rem)] sm:text-[clamp(2.6rem,8vw,6rem)]" style={{ color: '#1a1815', letterSpacing: '-0.01em' }}>
        {WORDS.map(({ word, offset }, index) => (
          <span key={word} aria-hidden="true">
            {index > 0 && <span aria-hidden="true">{' '}</span>}
            <span data-title-word={word} aria-hidden="true" className="inline-block whitespace-nowrap">
              {[...word].map((letter, position) => {
                const i = offset + position;
                return <motion.span key={i} className="inline-block"
                  animate={{ y: reducedMotion ? OFFSETS[i] : [OFFSETS[i] - 5, OFFSETS[i] + 5, OFFSETS[i] - 5] }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}>{letter}</motion.span>;
              })}
            </span>
          </span>
        ))}
      </h1>
    </div>
  );
}