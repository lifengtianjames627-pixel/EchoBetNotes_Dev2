import React from 'react';
import { useGenreText } from '@/i18n/useGenreText';
import { GENRES } from '@/lib/genreConfig';
import ReviewEditPicks from '@/components/reviews/ReviewEditPicks';
export default function ReviewEditFields({ draft, setDraft, kind, copy }) {
  const album = !kind || kind === 'album_review';
  const { localizedGenres } = useGenreText();
  const change = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const fields = ['title','content', ...(album ? ['band_style','band_background','band_history','band_story'] : ['hero_image_url'])];
  return <div className="space-y-4">
    {fields.map(key => <label key={key} className="block text-sm space-y-1">{copy[key]}
      <textarea name={key} aria-label={copy[key]} value={draft[key] || ''} onChange={e => change(key, e.target.value)} rows={key === 'content' ? 7 : key.startsWith('band_') ? 2 : 1} required={key === 'content' || (key === 'title' && !album)} className="block w-full rounded-md border bg-background text-foreground p-2 resize-y" />
    </label>)}
    {album ? <label className="block text-sm">{copy.rating}<input name="rating" aria-label={copy.rating} type="number" min="1" max="5" step="0.5" required value={draft.rating ?? 1} onChange={e => change('rating', Number(e.target.value))} className="ml-3 w-20 rounded-md border bg-background p-2" /></label> :
      <label className="block text-sm">{copy.genre}<select aria-label={copy.genre} value={draft.genre || ''} onChange={e => change('genre', e.target.value)} className="ml-3 border rounded bg-background p-2"><option value="">—</option>{(localizedGenres || GENRES).map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>}
    {kind === 'genre_roundup' && <ReviewEditPicks value={draft.featured_albums || []} onChange={v => change('featured_albums', v)} copy={copy} />}
  </div>;
}