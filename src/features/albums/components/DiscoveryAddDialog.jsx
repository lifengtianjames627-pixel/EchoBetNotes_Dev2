import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { genreLabels } from '@/components/GenreBadge';
const initial = { title: '', artist: '', genre: '', release_year: '', cover_url: '', description: '' };
export default function DiscoveryAddDialog({ copy, open, onClose, create }) {
  const [draft, setDraft] = useState(initial);
  const field = key => ({ value: draft[key], onChange: e => setDraft(d => ({ ...d, [key]: e.target.value })) });
  return <Dialog open={open} onOpenChange={value => { if (!value && !create.isPending) onClose(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{copy.add}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); create.mutate(draft); }}>
        <label className="block space-y-1 text-sm">{copy.name}<Input {...field('title')} required aria-label={copy.name} /></label>
        <label className="block space-y-1 text-sm">{copy.artist}<Input {...field('artist')} required aria-label={copy.artist} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">{copy.genre}<select {...field('genre')} className="w-full rounded-md border bg-background p-2" aria-label={copy.genre}><option value="">{copy.all}</option>{Object.entries(genreLabels).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label className="space-y-1 text-sm">{copy.year}<Input {...field('release_year')} type="number" min="1" max="9999" aria-label={copy.year} /></label>
        </div>
        <label className="block space-y-1 text-sm">{copy.cover}<Input {...field('cover_url')} type="url" aria-label={copy.cover} /></label>
        <label className="block space-y-1 text-sm">{copy.description}<Textarea {...field('description')} rows={3} aria-label={copy.description} /></label>
        {create.isError && <p role="alert" className="text-sm text-destructive">{copy.failed}</p>}
        <Button type="submit" disabled={create.isPending || !draft.title.trim() || !draft.artist.trim()} className="w-full">{create.isPending ? copy.saving : copy.add}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}