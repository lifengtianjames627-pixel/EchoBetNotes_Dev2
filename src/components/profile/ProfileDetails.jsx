import React from 'react';
import { MapPin, Music2, Radio } from 'lucide-react';

export default function ProfileDetails({ user }) {
  const preferences = user.music_preferences || [];
  return (
    <section className="p-5 sm:p-6 mb-6" style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 12 }}>
      {user.biography && (
        <p className="text-sm leading-relaxed mb-5 whitespace-pre-wrap" style={{ color: '#5a534a' }}>{user.biography}</p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-2.5" style={{ color: '#bf7a35' }}>
            <Radio className="w-3.5 h-3.5" /> Music taste
          </p>
          <div className="flex flex-wrap gap-1.5">
            {preferences.length ? preferences.map(item => (
              <span key={item} className="px-2.5 py-1 text-xs" style={{ background: '#f1ebdd', color: '#5a534a', border: '1px solid #e0d8c8', borderRadius: 999 }}>{item}</span>
            )) : <span className="text-xs" style={{ color: '#8a7e6f' }}>Still finding the sound.</span>}
          </div>
        </div>
        <div className="space-y-2 text-xs" style={{ color: '#5a534a' }}>
          <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" style={{ color: '#bf7a35' }} /> {user.location_network_allowed ? 'Network discovery is on' : 'Network discovery is off'}</p>
          <p className="flex items-center gap-2"><Music2 className="w-3.5 h-3.5" style={{ color: '#bf7a35' }} /> {user.has_band ? `In ${user.band_name || 'a band'}` : 'Not in a band right now'}</p>
        </div>
      </div>
    </section>
  );
}