import React from 'react';
import { motion } from 'framer-motion';
import { GENRES } from '@/lib/genreConfig';

const NOTES = [
  { n: '♪', delay: 0,   x: 5  },
  { n: '♫', delay: 1.1, x: 16 },
  { n: '♩', delay: 0.5, x: 27 },
  { n: '♬', delay: 1.7, x: 39 },
  { n: '♪', delay: 0.8, x: 52 },
  { n: '♫', delay: 2.1, x: 63 },
  { n: '♩', delay: 0.3, x: 74 },
  { n: '♬', delay: 1.4, x: 85 },
  { n: '♪', delay: 1.9, x: 93 },
];

function FloatingNote({ n, delay, x }) {
  return (
    <motion.span
      className="absolute text-xs select-none pointer-events-none"
      style={{ left: `${x}%`, bottom: 0, color: 'hsl(330,75%,55%)', opacity: 0 }}
      animate={{ y: [-2, -14, -2], opacity: [0, 0.5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      {n}
    </motion.span>
  );
}

export default function GenreBar({ selected, onSelect }) {
  return (
    <div className="pb-3 pt-5">
      {/* Floating notes strip */}
      <div className="relative h-5 mb-2 overflow-hidden">
        {NOTES.map((note, i) => (
          <FloatingNote key={i} {...note} />
        ))}
      </div>

      {/* Scrollable pills */}
      <div
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '4px' }}
      >
        {GENRES.map((genre, idx) => {
          const isSelected = selected === genre.id;
          return (
            <motion.button
              key={genre.id}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.065, duration: 0.28, ease: 'easeOut' }}
              onClick={() => onSelect(isSelected ? null : genre.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
              style={
                isSelected
                  ? { background: 'hsl(330,75%,55%)', color: '#fff', border: '1px solid hsl(330,75%,55%)' }
                  : { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }
              }
            >
              <span>{genre.icon}</span>
              <span>{genre.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}