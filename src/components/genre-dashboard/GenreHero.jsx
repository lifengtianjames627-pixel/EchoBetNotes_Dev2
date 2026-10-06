import React from 'react';
import { motion } from 'framer-motion';

// Middle-layer hero: one template, skinned per genre (photo + gradient overlay
// weighted toward the text side + genre title typography). Left-aligned copy
// sits on the heaviest part of the overlay so it always stays readable.
const PHOTOS = {
  rock: ['https://images.unsplash.com/photo-1546708770-589dab7b22c7?auto=format&fit=crop&w=1800&q=80', 'Guns N’ Roses · AC/DC · Motörhead'],
  pop: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1800&q=80'],
  classical: ['https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1800&q=80'],
  metal: ['https://images.unsplash.com/photo-1508973379184-7517410fb0bc?auto=format&fit=crop&w=1800&q=80', 'Wacken Open Air · 83,400 voices'],
  jazz: ['https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1800&q=80'],
  blues: ['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1800&q=80'],
  r_and_b: ['https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=80'],
  core: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1800&q=80'],
  country: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1800&q=80'],
  hip_hop: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=80'],
  indie: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=80'],
  grunge: ['https://images.unsplash.com/photo-1499415479124-43c32433a620?auto=format&fit=crop&w=1800&q=80'],
  electronic: ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1800&q=80'],
  funk: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80'],
  acg: ['https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1800&q=80'],
  cinematic: ['https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1800&q=80'],
};

export default function GenreHero({ genreId, label, tagline, description, skin }) {
  const [photo, note] = PHOTOS[genreId] || PHOTOS.electronic;
  const scale = skin.titleScale || 1;
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-12 overflow-hidden"
      style={{ borderRadius: skin.radius, minHeight: skin.heroHeight, border: `1px solid ${skin.accent}33` }}
    >
      <img src={photo} alt={`${label} music scene`} className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'saturate(0.7)' }} />
      <div className="absolute inset-0" style={{ background: skin.overlay }} />
      {skin.cinemaBars && (
        <>
          <div className="absolute inset-x-0 top-0 h-8" style={{ background: '#0a1525' }} />
          <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: '#0a1525' }} />
        </>
      )}
      <div className="relative flex flex-col justify-end p-7 sm:p-10" style={{ minHeight: skin.heroHeight }}>
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: skin.accent === '#a8b800' ? skin.accent : skin.subInk }}>
          {tagline}
        </p>
        <h1
          className="mt-3 leading-[0.95]"
          style={{
            fontFamily: skin.titleFont,
            textTransform: skin.titleTransform,
            ...skin.titleStyle,
            fontSize: `clamp(${2.6 * scale}rem, ${7 * scale}vw, ${5 * scale}rem)`,
            color: skin.ink,
          }}
        >
          {label}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed sm:text-base" style={{ color: skin.subInk }}>{description}</p>
        {note && <p className="mt-6 text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: skin.accent }}>{note}</p>}
      </div>
    </motion.section>
  );
}