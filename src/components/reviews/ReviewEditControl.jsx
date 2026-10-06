import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import editCopy from '@/components/reviews/editCopy';
import ReviewEditDialog from '@/components/reviews/ReviewEditDialog';
export default function ReviewEditControl({ review, user: userProp }) {
  const [editing, setEditing] = useState(false);
  const { lang } = useLang();
  const copy = editCopy(lang);
  const { data: userQuery } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), enabled: !userProp });
  const user = userProp || userQuery;
  // Only the author can edit their own review — strictly matched by user id or reviewer email, never by admin role or anyone else
  const owner = Boolean(
    user && (
      (review.created_by_id && user.id && review.created_by_id === user.id) ||
      (review.reviewer_email && user.email && review.reviewer_email.toLowerCase() === user.email.toLowerCase())
    )
  );
  return <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-muted-foreground" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
    {owner && <button type="button" data-testid={`edit-review-${review.id}`} onClick={() => setEditing(true)} title={copy.edit} aria-label={copy.edit} className="inline-flex items-center justify-center p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>}
    {review.edited_at && <time dateTime={review.edited_at} title={(review.edit_times || [review.edited_at]).map(d => new Date(d).toLocaleString(lang)).join('\n')}>{copy.edited} {new Date(review.edited_at).toLocaleString(lang)}</time>}
    {owner && review.moderation_status === 'pending_review' && <span>{copy.pending}</span>}
    {editing && <ReviewEditDialog review={review} onClose={() => setEditing(false)} />}
  </div>;
}