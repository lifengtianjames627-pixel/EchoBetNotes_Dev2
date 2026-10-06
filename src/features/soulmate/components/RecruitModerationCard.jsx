import React from 'react';
import PrivatePosterImage from '@/features/soulmate/components/PrivatePosterImage';
export default function RecruitModerationCard({ post, copy, pending, onStatus }) {
  return <article className="rounded-lg border bg-card p-4 text-card-foreground space-y-3">
    <h3 className="font-semibold break-words">{post.title}</h3>
    <p className="text-xs text-muted-foreground">{post.author_name || 'Anonymous'}</p>
    {post.poster_asset_id && <PrivatePosterImage post={post} className="max-h-80 max-w-full object-contain" />}
    <div className="text-sm whitespace-pre-wrap break-words">{[post.band_name, post.city, post.school, post.influences, post.description, ...(post.looking_for || []), ...(post.i_play || []), ...(post.genre_tags || [])].filter(Boolean).join('\n')}</div>
    {post.moderation_reason && <p className="text-xs text-muted-foreground">{post.moderation_reason}</p>}
    <div className="flex flex-wrap gap-2">
      <button disabled={pending || post.moderation_status === 'approved'} onClick={() => onStatus(post.id, 'approved')} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">{copy.approve}</button>
      <button disabled={pending || post.moderation_status === 'blocked'} onClick={() => onStatus(post.id, 'blocked')} className="rounded-md border px-3 py-2 text-sm text-destructive disabled:opacity-40">{copy.reject}</button>
    </div>
  </article>;
}