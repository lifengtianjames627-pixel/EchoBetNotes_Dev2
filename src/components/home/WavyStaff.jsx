import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const LINES = [10, 27.5, 45, 62.5, 80].map(y => {
  let d = `M 0 ${y}`;
  for (let x = 0; x <= 200; x += 4) {
    d += ` L ${x} ${(y + Math.sin((x / 100) * 2 * Math.PI) * 12).toFixed(2)}`;
  }
  return d;
});

export default function WavyStaff() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.svg className="w-[200%] h-full" preserveAspectRatio="none" viewBox="0 0 200 100" aria-hidden="true"
      animate={{ x: reducedMotion ? '0%' : ['-50%', '0%'] }}
      transition={reducedMotion ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: 'linear' }}>
      {LINES.map((d, i) => (
        <path key={i} d={d} stroke="#bf7a35" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
      ))}
    </motion.svg>
  );
}