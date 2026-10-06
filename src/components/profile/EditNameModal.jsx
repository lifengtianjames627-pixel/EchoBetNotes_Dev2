import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useReviewerProfileRefresh } from '@/components/ReviewerProfileProvider';
import { Loader2, X } from 'lucide-react';

// Paper-styled modal that lets a member set a display name. The platform
// full_name can't be changed via updateMe, so display_name overrides it
// wherever displayName() is used. Empty input clears the override and falls
// back to the platform name.
export default function EditNameModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const refreshProfiles = useReviewerProfileRefresh();
  const [value, setValue] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 40) { setErr('Keep it under 40 characters.'); return; }
    setSaving(true); setErr('');
    try {
      await base44.auth.updateMe({ display_name: trimmed });
      // Re-sync this member's name to every historical record that snapshotted it
      // (reviews, posts, comments, messages, …) so the new name shows everywhere.
      await base44.functions.invoke('propagateProfile', {});
      refreshProfiles(); // drop live-profile cache so review cards re-fetch the new name
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries(); // refresh all cached lists so new names render
      onClose();
    } catch (e2) {
      setErr('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const fallback = user?.full_name || user?.email || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4 relative"
        style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}
        onClick={e => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center" style={{ color: '#8a7e6f' }}>
          <X className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#bf7a35' }}>Your name</p>
          <h2 className="font-playfair italic text-xl mt-1" style={{ color: '#1a1815' }}>Change display name</h2>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#6b6358' }}>
          This is the name shown on your profile, reviews, messages and posts. Leave it blank to go back to <span className="font-semibold" style={{ color: '#1a1815' }}>{fallback}</span>.
        </p>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          maxLength={40}
          placeholder={fallback}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }}
        />
        {err && <p className="text-xs" style={{ color: '#c0392b' }}>{err}</p>}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: '#1a1815', color: '#faf8f2', opacity: saving ? 0.6 : 1 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm" style={{ color: '#8a7e6f' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}