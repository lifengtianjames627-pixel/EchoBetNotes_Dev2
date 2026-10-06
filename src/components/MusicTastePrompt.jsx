import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Sparkles } from 'lucide-react';

// Gentle paper banner shown to logged-in members who haven't picked their
// music tastes yet. Once they set music_preferences the home "For You" feed
// (which blends preferences with click tallies) has a baseline to work from.
// Dismissable per browser so it never nags someone who'd rather just browse.
export default function MusicTastePrompt() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('taste_prompt_dismissed') === '1'
  );

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  if (!user) return null;
  const prefs = Array.isArray(user.music_preferences) ? user.music_preferences : [];
  if (prefs.length > 0) return null;
  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem('taste_prompt_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="relative z-20 px-4 pt-3">
      <div
        className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: '#faf8f2', border: '1px solid #ddd0b6', boxShadow: '0 2px 12px rgba(120,100,80,0.06)' }}
      >
        <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#bf7a35' }} />
        <p className="text-xs leading-relaxed flex-1" style={{ color: '#5a534a' }}>
          Pick the sounds you love and your <span className="font-semibold" style={{ color: '#1a1815' }}>For You</span> feed comes alive.
        </p>
        <button
          onClick={() => navigate('/profile/setup')}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:opacity-90"
          style={{ background: '#1a1815', color: '#faf8f2' }}
        >
          Set my taste
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-[#e6ddc9]"
          style={{ color: '#8a7e6f' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}