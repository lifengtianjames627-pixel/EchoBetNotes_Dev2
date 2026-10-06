import React from 'react';
import HomeMotif from '@/components/home/HomeMotif';
import VinylDisc from '@/components/home/VinylDisc';

const NOTES = [
  { top: '15%', left: '8%', kind: 'staff' }, { top: '24%', right: '12%', kind: 'wave' },
  { top: '64%', left: '14%', kind: 'slur' }, { top: '72%', right: '8%', kind: 'note' },
  { top: '46%', left: '52%', kind: 'wave' },
];

export default function HomeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=80" alt="" className="w-full h-full object-cover"
          style={{ filter: 'blur(30px) saturate(0.6) brightness(1.04)', transform: 'scale(1.12)' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(243,239,230,0.8)' }} />
      </div>
      <div className="absolute inset-x-0 top-[8%] h-[42%] z-0">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {[20, 35, 50, 65, 80].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#bf7a35" strokeWidth="0.18" opacity="0.1" vectorEffect="non-scaling-stroke" />)}
        </svg>
      </div>
      {NOTES.map(({ kind, ...position }, i) => (
        <span key={i} className="absolute z-0" style={position}>
          <span className="block opacity-[0.12]" style={{ transform: 'scale(0.6)', transformOrigin: 'center' }}><HomeMotif kind={kind} /></span>
        </span>
      ))}
      <VinylDisc />
    </div>
  );
}