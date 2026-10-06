import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';
import RecruitModerationCard from '@/features/soulmate/components/RecruitModerationCard';
export default function RecruitModerationPanel({ filter }) {
  const { lang } = useLang();
  const copy = recruitCopy(lang);
  const client = useQueryClient();
  const posts = useQuery({ queryKey: ['moderation-recruit', filter], queryFn: () => base44.entities.RecruitPost.filter(filter === 'all' ? {} : { moderation_status: filter }, '-created_date', 100) });
  const save = useMutation({
    mutationFn: ({ id, status }) => base44.entities.RecruitPost.update(id, { moderation_status: status }),
    onSuccess: async (updated, { id }) => {
      // Do not render an old approved snapshot while the follow-up request is pending.
      client.setQueriesData({ queryKey: ['recruit-posts'] }, old => old?.filter(post => post.id !== id));
      const email = updated.author_email || posts.data?.find(post => post.id === id)?.author_email;
      client.setQueriesData({ queryKey: ['chat-directory'] }, old => old ? { ...old, nearby: (old.nearby || []).filter(peer => peer.email !== email) } : old);
      await Promise.all(['moderation-recruit', 'recruit-posts', 'chat-directory', 'recruit-poster'].map(key => client.invalidateQueries({ queryKey: [key] })));
    },
  });
  return <section className="mt-10 space-y-3" aria-label={copy.recruitment}>
    <h2 className="text-xl font-playfair text-foreground">{copy.recruitment}</h2>
    {(posts.error || save.error) && <p role="alert" className="text-sm text-destructive">{copy.failed}{posts.error && <button onClick={() => posts.refetch()} className="ml-2 underline">{copy.retry}</button>}</p>}
    {posts.isLoading ? <p className="text-sm text-muted-foreground">{copy.saving}</p> : !posts.error && !posts.data?.length ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : posts.data?.map(post => <RecruitModerationCard key={post.id} post={post} copy={copy} pending={save.isPending} onStatus={(id, status) => save.mutate({ id, status })} />)}
  </section>;
}