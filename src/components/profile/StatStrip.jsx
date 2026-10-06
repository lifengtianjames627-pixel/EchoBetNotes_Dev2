import React from 'react';

// Four plain paper stat tiles — numbers in serif ink, ochre hairline on top.
export default function StatStrip({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-7">
      {stats.map(({ label, val }) => (
        <div
          key={label}
          className="text-center px-2 py-4"
          style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 10 }}
        >
          <div className="mx-auto mb-2 h-px w-8" style={{ background: '#bf7a35', opacity: 0.5 }} />
          <p className="font-playfair text-2xl" style={{ color: '#1a1815' }}>{val}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] mt-1" style={{ color: '#8a7e6f' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}