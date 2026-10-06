import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
export default function ReviewEditPicks({ value, onChange, copy }) {
  const update = (i, k, text) => onChange(value.map((a, n) => n === i ? { ...a, [k]: text } : a));
  return <fieldset className="space-y-3"><legend className="text-sm font-semibold">{copy.picks}</legend>
    {value.map((a, i) => <div key={i} className="border rounded-lg p-3 space-y-2">
      {['title','artist','cover_url','blurb'].map(k => <label key={k} className="block text-xs">{copy[k]}<textarea aria-label={`${copy[k]} ${i + 1}`} value={a[k] || ''} onChange={e => update(i, k, e.target.value)} required={k === 'title'} rows={k === 'blurb' ? 3 : 1} className="w-full rounded border bg-background p-2 text-foreground" /></label>)}
      <button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))} className="inline-flex gap-1 text-xs text-muted-foreground"><Trash2 className="w-3 h-3" />{copy.remove}</button>
    </div>)}
    <button type="button" onClick={() => onChange([...value, { title: '', artist: '', cover_url: '', blurb: '' }])} className="inline-flex items-center gap-1 text-sm"><Plus className="w-4 h-4" />{copy.add}</button>
  </fieldset>;
}