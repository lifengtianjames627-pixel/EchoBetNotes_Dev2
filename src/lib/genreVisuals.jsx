import React from 'react';

// Neon glow colors: dark glass bg + neon border/text/glow
export const BUBBLE_COLORS = [
  { bg: 'rgba(30,20,80,0.6)',  border: '#7c6fff', text: '#c4baff', glow: '0 0 28px 6px rgba(124,111,255,0.5), 0 0 70px 10px rgba(124,111,255,0.15)' },
  { bg: 'rgba(10,40,80,0.6)',  border: '#38bdf8', text: '#93e4ff', glow: '0 0 28px 6px rgba(56,189,248,0.5), 0 0 70px 10px rgba(56,189,248,0.15)' },
  { bg: 'rgba(60,10,60,0.6)',  border: '#f472b6', text: '#ffb3d9', glow: '0 0 28px 6px rgba(244,114,182,0.5), 0 0 70px 10px rgba(244,114,182,0.15)' },
  { bg: 'rgba(10,55,35,0.6)',  border: '#34d399', text: '#a7f3d0', glow: '0 0 28px 6px rgba(52,211,153,0.5), 0 0 70px 10px rgba(52,211,153,0.15)' },
  { bg: 'rgba(70,35,10,0.6)',  border: '#fb923c', text: '#fed7aa', glow: '0 0 28px 6px rgba(251,146,60,0.5), 0 0 70px 10px rgba(251,146,60,0.15)' },
  { bg: 'rgba(65,10,30,0.6)',  border: '#f87171', text: '#fecaca', glow: '0 0 28px 6px rgba(248,113,113,0.5), 0 0 70px 10px rgba(248,113,113,0.15)' },
  { bg: 'rgba(55,10,70,0.6)',  border: '#c084fc', text: '#e9d5ff', glow: '0 0 28px 6px rgba(192,132,252,0.5), 0 0 70px 10px rgba(192,132,252,0.15)' },
  { bg: 'rgba(10,55,55,0.6)',  border: '#2dd4bf', text: '#99f6e4', glow: '0 0 28px 6px rgba(45,212,191,0.5), 0 0 70px 10px rgba(45,212,191,0.15)' },
  { bg: 'rgba(60,55,10,0.6)',  border: '#fbbf24', text: '#fde68a', glow: '0 0 28px 6px rgba(251,191,36,0.5), 0 0 70px 10px rgba(251,191,36,0.15)' },
  { bg: 'rgba(15,30,65,0.6)',  border: '#60a5fa', text: '#bfdbfe', glow: '0 0 28px 6px rgba(96,165,250,0.5), 0 0 70px 10px rgba(96,165,250,0.15)' },
  { bg: 'rgba(10,50,20,0.6)',  border: '#86efac', text: '#bbf7d0', glow: '0 0 28px 6px rgba(134,239,172,0.5), 0 0 70px 10px rgba(134,239,172,0.15)' },
  { bg: 'rgba(65,20,10,0.6)',  border: '#fdba74', text: '#fed7aa', glow: '0 0 28px 6px rgba(253,186,116,0.5), 0 0 70px 10px rgba(253,186,116,0.15)' },
  { bg: 'rgba(40,10,65,0.6)',  border: '#a78bfa', text: '#ddd6fe', glow: '0 0 28px 6px rgba(167,139,250,0.5), 0 0 70px 10px rgba(167,139,250,0.15)' },
  { bg: 'rgba(60,45,10,0.6)',  border: '#facc15', text: '#fef08a', glow: '0 0 28px 6px rgba(250,204,21,0.5), 0 0 70px 10px rgba(250,204,21,0.15)' },
  { bg: 'rgba(10,45,60,0.6)',  border: '#22d3ee', text: '#a5f3fc', glow: '0 0 28px 6px rgba(34,211,238,0.5), 0 0 70px 10px rgba(34,211,238,0.15)' },
  { bg: 'rgba(40,30,10,0.6)',  border: '#d4a24c', text: '#f0dcb0', glow: '0 0 28px 6px rgba(212,162,76,0.5), 0 0 70px 10px rgba(212,162,76,0.15)' },
];

// SVG icons per genre — clean, minimal, edgy
export const GENRE_ICONS = {
  rock: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 32 L16 8 L22 20 L28 12 L32 32" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="32" cy="32" r="3" fill={color}/>
      <circle cx="8" cy="32" r="3" fill={color}/>
    </svg>
  ),
  pop: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="10" stroke={color} strokeWidth="2.2"/>
      <path d="M20 4 L20 10 M20 30 L20 36 M4 20 L10 20 M30 20 L36 20" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="3" fill={color}/>
    </svg>
  ),
  classical: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 30 L12 12 Q12 8 16 8 Q20 8 20 12 L20 24" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <ellipse cx="9" cy="30" rx="4" ry="3" stroke={color} strokeWidth="2"/>
      <path d="M20 28 L20 14 M20 14 L28 10 L28 24" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <ellipse cx="31" cy="24" rx="4" ry="3" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  metal: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 8 L20 32 L32 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 20 L28 20" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M6 36 L34 36" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  jazz: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 32 Q14 18 22 14 Q30 10 30 18 Q30 26 22 28 L14 32" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="33" r="3.5" stroke={color} strokeWidth="2"/>
      <path d="M22 28 L22 38" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  blues: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 26 Q14 20 20 26 Q26 32 32 26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 18 Q14 12 20 18 Q26 24 32 18" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 10 Q14 4 20 10 Q26 16 32 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  r_and_b: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="10" height="16" rx="5" stroke={color} strokeWidth="2.2"/>
      <rect x="22" y="10" width="10" height="20" rx="5" stroke={color} strokeWidth="2.2"/>
      <path d="M18 22 L22 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  core: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 34 L20 6 L34 34 Z" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M12 26 L28 26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  country: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6 Q28 6 32 14 L32 32 Q28 36 20 36 Q12 36 8 32 L8 14 Q12 6 20 6Z" stroke={color} strokeWidth="2"/>
      <path d="M14 20 Q17 16 20 20 Q23 24 26 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 28 L20 36" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  hip_hop: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="28" height="20" rx="3" stroke={color} strokeWidth="2.2"/>
      <path d="M12 20 L16 16 L20 22 L24 14 L28 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  indie: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="13" stroke={color} strokeWidth="2.2"/>
      <circle cx="20" cy="20" r="7" stroke={color} strokeWidth="1.8"/>
      <circle cx="20" cy="20" r="2.5" fill={color}/>
      <path d="M20 7 L20 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 37 L20 33" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  grunge: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20 Q11 10 20 10 Q29 10 32 20 Q29 30 20 30 Q11 30 8 20Z" stroke={color} strokeWidth="2"/>
      <path d="M14 20 L18 16 L22 24 L26 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  electronic: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20 L10 20 L14 10 L18 30 L22 14 L26 26 L30 20 L36 20" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  funk: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="12" r="5" stroke={color} strokeWidth="2.2"/>
      <path d="M20 17 L20 26 M20 26 L12 34 M20 26 L28 34" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M12 22 L28 22" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  acg: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="14" width="28" height="16" rx="8" stroke={color} strokeWidth="2.2"/>
      <path d="M14 19 L14 25 M11 22 L17 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="25" cy="20" r="1.8" fill={color}/>
      <circle cx="29" cy="24" r="1.8" fill={color}/>
    </svg>
  ),
  cinematic: (color) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 14 L34 14 L34 32 Q34 34 32 34 L8 34 Q6 34 6 32 Z" stroke={color} strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M6 14 L10 6 L16 6 L12 14 Z M18 14 L22 6 L28 6 L24 14 Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M14 20 L26 26 L14 32 Z" fill={color} opacity="0.7"/>
    </svg>
  ),
};