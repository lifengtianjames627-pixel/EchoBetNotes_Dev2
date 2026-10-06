import React from 'react';
import { Shuffle } from 'lucide-react';
import { randomAlias } from '@/lib/randomAlias';

// First-login name step. The member picks the nickname others will see; if they
// skip it, onboarding generates a music-themed alias so their email is never
// the only identifier shown publicly.
export default function SetupName({ value, onChange }) {
  return (
    <section className="mt-7">
      <label className="block text-sm font-semibold" style={{ color: '#1a1815' }}>Your nickname</label>
      <p className="text-xs mt-1 mb-3" style={{ color: '#6b6358' }}>
        This is the name shown on your reviews, posts and profile — your email stays private. Leave it blank and we'll pick a music name for you.
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={40}
          placeholder="Pick a nickname…"
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }}
        />
        <button
          type="button"
          onClick={() => onChange(randomAlias())}
          className="shrink-0 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: '#f1ebdd', border: '1px solid #e0d8c8', color: '#8a5a20' }}
          title="Generate a random music name"
        >
          <Shuffle className="w-3.5 h-3.5" /> Surprise me
        </button>
      </div>
    </section>
  );
}