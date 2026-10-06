import React from 'react';

// Giant spinning vinyl record anchored to the right half of the hero.
// Sits behind the content, fades toward the centre so it never fights the text.
export default function VinylDisc() {
  return (
    <div
      aria-hidden
      className="absolute z-0 pointer-events-none hidden md:block top-1/2 -translate-y-1/2"
      style={{
        right: '-26vw', width: 'min(96vh, 64vw)', aspectRatio: '1',
        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.25) 22%, #000 42%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.25) 22%, #000 42%)',
        opacity: 0.85,
      }}
    >
      <div className="relative w-full h-full rounded-full animate-[spin_9s_linear_infinite]"
        style={{
          background: 'repeating-radial-gradient(circle, #151412 0 1.5px, #22201c 1.5px 3px), #181714',
          boxShadow: '0 30px 80px rgba(40,30,20,0.35), inset 0 0 0 6px #0d0c0b',
        }}>
        {/* Light sheen sweeping across the grooves */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'conic-gradient(from 20deg, transparent 0 12%, rgba(255,248,235,0.14) 18%, transparent 26% 55%, rgba(255,248,235,0.1) 62%, transparent 70%)' }} />
        {/* A softened paper label that echoes the site palette rather than becoming a separate colour block. */}
        <div className="absolute rounded-full"
          style={{
            inset: '34%',
            background: 'repeating-radial-gradient(circle, rgba(255,255,255,0.12) 0 1px, transparent 1px 5px), radial-gradient(circle, #efe8d8 0%, #d9ccaf 68%, #b7a483 100%)',
            boxShadow: 'inset 0 0 0 2px rgba(67,55,39,0.32), 0 0 0 7px rgba(243,239,230,0.12)',
          }}>
          <div className="absolute inset-[22%] rounded-full" style={{ border: '1px solid rgba(67,55,39,0.32)' }} />
          <div className="absolute inset-[39%] rounded-full" style={{ background: '#292620', boxShadow: '0 0 0 5px rgba(243,239,230,0.24), inset 0 0 0 1px rgba(255,255,255,0.17)' }}>
            <div className="absolute rounded-full" style={{ inset: '33%', background: '#f3efe6', boxShadow: '0 0 0 2px rgba(67,55,39,0.22)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}