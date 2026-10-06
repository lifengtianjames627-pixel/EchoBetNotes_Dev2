import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BUBBLE_COLORS, GENRE_ICONS } from '@/lib/genreVisuals';

const ANGLES = [-52, 0, 52]; // degrees from vertical (left, center, right) — wide, natural spread
const PIVOT = { x: 400, y: 390 };
const PIN_RADIUS = 270;
const NEEDLE_LEN = 150;
const BUBBLE_Y_OFFSET = 50; // shift bubbles up only, needle stays at PIVOT

function polar(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: PIVOT.x + radius * Math.sin(rad), y: PIVOT.y - radius * Math.cos(rad) };
}

function describeArc(radius, startAngle, endAngle) {
  const start = polar(endAngle, radius);
  const end = polar(startAngle, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`;
}

export default function GenreGauge({ items, onSelect }) {
  const [hovered, setHovered] = useState(1); // default: center genre
  const needlePoint = polar(ANGLES[hovered], NEEDLE_LEN);

  // The gauge is drawn in a fixed 800×420 space, so on narrow screens we scale
  // the whole stage down instead of letting the pixel-positioned bubbles spill
  // off the right edge.
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / 800));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full" style={{ height: 420 * scale }}>
    <div className="relative mx-auto" style={{ width: 800, height: 420, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <svg viewBox="0 0 800 420" className="absolute inset-0 w-full h-full pointer-events-none">
        <path d={describeArc(300, -68, 68)} fill="none" stroke="rgba(124,111,255,0.18)" strokeWidth="2" />
        {Array.from({ length: 13 }).map((_, i) => {
          const a = -66 + (132 / 12) * i;
          const p1 = polar(a, 282);
          const p2 = polar(a, 296);
          return (
            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(165,138,252,0.3)" strokeWidth={i % 2 === 0 ? 2 : 1} />
          );
        })}
        <motion.line
          x1={PIVOT.x} y1={PIVOT.y}
          animate={{ x2: needlePoint.x, y2: needlePoint.y }}
          transition={{ type: 'spring', stiffness: 130, damping: 15 }}
          stroke="#a5b4fc" strokeWidth="3.5" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px #7c6fff)' }}
        />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="8" fill="#a5b4fc" style={{ filter: 'drop-shadow(0 0 8px #7c6fff)' }} />
      </svg>

      {items.map((item, i) => {
        const pos = polar(ANGLES[i], PIN_RADIUS);
        const isActive = hovered === i;
        const size = isActive ? 204 : 172;
        const c = BUBBLE_COLORS[item.colorIdx % BUBBLE_COLORS.length];
        const IconSvg = GENRE_ICONS[item.genre.id] || GENRE_ICONS['electronic'];
        return (
          <motion.div
            key={item.genre.id}
            className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer select-none"
            style={{
              left: pos.x,
              top: pos.y - BUBBLE_Y_OFFSET,
              width: size,
              height: size,
              transform: 'translate(-50%, -50%)',
              background: isActive ? c.bg.replace('0.6', '0.85') : c.bg,
              border: `${isActive ? 2 : 1.5}px solid ${c.border}`,
              boxShadow: isActive ? `0 0 50px 14px ${c.border}55, 0 0 100px 20px ${c.border}22` : c.glow,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              zIndex: isActive ? 10 : 1,
            }}
            animate={{ scale: isActive ? 1.03 : 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onHoverStart={() => setHovered(i)}
            onClick={() => onSelect(item.genre.id)}
          >
            <div style={{ width: size * 0.34, height: size * 0.34, filter: `drop-shadow(0 0 8px ${c.border})` }}>
              {IconSvg(c.border)}
            </div>
            <span
              className="font-bold uppercase mt-1.5 text-center"
              style={{ color: c.text, fontSize: size * 0.095, letterSpacing: '0.1em', textShadow: `0 0 8px ${c.border}` }}
            >
              {item.genre.label}
            </span>
          </motion.div>
        );
      })}
    </div>
    </div>
  );
}