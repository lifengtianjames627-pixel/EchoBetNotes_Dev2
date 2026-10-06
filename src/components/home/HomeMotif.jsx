import React from 'react';

// Distinct staff, wave, slur and note motifs; purely decorative.
export default function HomeMotif({ kind }) {
  const ink = '#bf7a35';
  const op = 0.8;
  if (kind === 'staff') return (
    <svg aria-hidden="true" width="66" height="38" viewBox="0 0 66 38" fill="none">
      {[10, 16, 22, 28, 34].map(y => <line key={y} x1="2" y1={y} x2="64" y2={y} stroke={ink} strokeWidth="0.7" opacity="0.4" />)}
      <ellipse cx="20" cy="25" rx="4" ry="3" transform="rotate(-20 20 25)" fill={ink} opacity={op} />
      <ellipse cx="44" cy="22" rx="4" ry="3" transform="rotate(-20 44 22)" fill={ink} opacity={op} />
      <path d="M23.5 25 V 9 M47.5 22 V 6" stroke={ink} strokeWidth="1.2" opacity={op} />
      <path d="M23.3 8.6 H 47.3" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity={op} />
    </svg>
  );
  if (kind === 'wave') return (
    <svg aria-hidden="true" width="60" height="30" viewBox="0 0 60 30" fill="none">
      {[[6, 9, 21], [14, 5, 25], [22, 11, 19], [30, 3, 27], [38, 8, 22], [46, 12, 18], [54, 6, 24]].map(([x, y1, y2], i) => (
        <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={ink} strokeWidth="2" strokeLinecap="round" opacity={op} />
      ))}
    </svg>
  );
  if (kind === 'slur') return (
    <svg aria-hidden="true" width="46" height="40" viewBox="0 0 46 40" fill="none">
      <ellipse cx="9" cy="32" rx="5" ry="3.8" transform="rotate(-20 9 32)" fill={ink} opacity={op} />
      <ellipse cx="34" cy="28" rx="5" ry="3.8" transform="rotate(-20 34 28)" fill={ink} opacity={op} />
      <path d="M13.7 32 V 14 M38.7 28 V 10" stroke={ink} strokeWidth="1.4" opacity={op} />
      <path d="M12 12 Q 25 3 39 7" stroke={ink} strokeWidth="1.3" fill="none" opacity={op} />
    </svg>
  );
  if (kind === 'note') return (
    <svg aria-hidden="true" width="20" height="34" viewBox="0 0 20 34" fill="none">
      <ellipse cx="6" cy="28" rx="5" ry="3.8" transform="rotate(-20 6 28)" fill={ink} opacity={op} />
      <path d="M10.7 28 V 6" stroke={ink} strokeWidth="1.4" opacity={op} />
      <path d="M10.7 6 C 17 8 18.5 14 15 18" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity={op} />
    </svg>
  );
  return null;
}