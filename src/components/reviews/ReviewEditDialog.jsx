import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useSaveReviewEdit from '@/features/reviews/queries/useSaveReviewEdit';
import { useLang } from '@/i18n/LanguageContext';
import editCopy from '@/components/reviews/editCopy';
import ReviewEditFields from '@/components/reviews/ReviewEditFields';
export default function ReviewEditDialog({ review, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...review, ...Object.fromEntries(['title','content','band_style','band_background','band_history','band_story','genre','hero_image_url'].map(k => [k, review[k] || ''])), featured_albums: (review.featured_albums || []).map(a => ({ ...a })) }));
  const { lang } = useLang();
  const copy = editCopy(lang);
  const save = useSaveReviewEdit({ review, draft, onSuccess: onClose });
  return createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center bg-foreground/40 p-3" onClick={e => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape' && !save.isPending) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="review-edit-title" className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-xl border bg-card text-card-foreground shadow-xl p-5">
      {save.error && <p role="alert" className="text-destructive text-sm mb-3">{save.error.response?.status === 409 ? copy.conflict : copy.failed} {save.error.response?.data?.error !== 'conflict' && save.error.response?.data?.error}</p>}
      <h2 id="review-edit-title" className="text-lg font-semibold mb-4">{copy.edit}</h2>
      <form onSubmit={e => { e.preventDefault(); save.mutate(); }}>
        <fieldset disabled={save.isPending} className="min-w-0"><ReviewEditFields draft={draft} setDraft={setDraft} kind={review.kind} copy={copy} /></fieldset>
        <div className="flex justify-end gap-3 mt-5">
          <button type="button" onClick={onClose} disabled={save.isPending} className="px-4 py-2 text-sm text-muted-foreground">{copy.cancel}</button>
          <button type="submit" disabled={save.isPending || !draft.content?.trim() || (review.kind === 'genre_roundup' && !draft.featured_albums?.length)} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">{save.isPending ? copy.saving : copy.save}</button>
        </div>
      </form>
    </section>
  </div>, document.body);
}