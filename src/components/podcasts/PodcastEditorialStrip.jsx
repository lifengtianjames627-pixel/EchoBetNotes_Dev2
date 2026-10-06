import React from 'react';

// Paper editorial strip — warm paper card with a listening-room photo.
export default function PodcastEditorialStrip() {
  return (
    <section className="mt-14 overflow-hidden" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=85" alt="Friends listening and making music together" className="h-60 w-full object-cover md:h-full" />
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: '#bf7a35' }}>From the listening room</p>
          <h2 className="mt-3 font-playfair text-3xl italic leading-tight" style={{ color: '#1a1815' }}>Every episode starts with somebody who cares enough to listen.</h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: '#6b6358' }}>Stories, scene notes, and songs passed between people — not just another silent catalogue.</p>
        </div>
      </div>
    </section>
  );
}