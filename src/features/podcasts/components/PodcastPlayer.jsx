import React, { useState } from 'react';
import { Play, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/appClient';
import { useLang } from '@/i18n/LanguageContext';
import podcastCopy from '@/features/podcasts/i18n/podcastCopy';
/** @param {{ episode: import('@/features/podcasts/model/podcastTypes').PodcastEpisode }} props */
export default function PodcastPlayer({ episode }) {
  const { isAuthenticated, isLoadingAuth } = useAuth(), { lang } = useLang();
  const copy = podcastCopy(lang);
  const [src, setSrc] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const load = async () => {
    setBusy(true); setError(false); setSrc('');
    try { if (episode.audio_asset_id) { const { data } = await apiClient.functions.invoke('getPodcastAudio', { podcast_id: episode.id }); setSrc(data.signed_url); } else setSrc(episode.audio_url || ''); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  if (!episode.audio_asset_id && !episode.audio_url) return null;
  if (!isAuthenticated) return <button disabled={isLoadingAuth} onClick={() => apiClient.auth.redirectToLogin(window.location.href)} className="mt-3 flex items-center gap-2 text-xs text-accent underline"><LockKeyhole className="h-3.5 w-3.5" />{copy.login}</button>;
  return <div className="mt-3" data-testid="podcast-player">
    {src && !error ? <audio aria-label={episode.title} controls autoPlay preload="metadata" src={src} onError={() => setError(true)} className="block w-full min-w-0" /> : <button disabled={busy} onClick={load} className="flex items-center gap-2 border bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground disabled:opacity-50"><Play className="h-3.5 w-3.5" />{busy ? copy.loading : error ? copy.retry : copy.listen}</button>}
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{copy.playbackError}</p>}
  </div>;
}