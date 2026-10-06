import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import privacyCopy from '@/features/soulmate/i18n/privacyCopy';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';
export default function PrivatePosterImage({ post, className }) {
  const { lang } = useLang();
  const copy = privacyCopy(lang), shared = recruitCopy(lang);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const image = useQuery({
    queryKey: ['recruit-poster', me?.id, 'open-discovery', post.id, post.moderation_status],
    queryFn: async () => (await base44.functions.invoke('getRecruitPoster', { post_id: post.id })).data,
    enabled: !!me?.id && !!post.poster_asset_id, staleTime: 0, gcTime: 0,
    refetchInterval: 45000, refetchOnWindowFocus: 'always', retry: false,
  });
  if (image.isError || !post.poster_asset_id) return <div className="p-3 text-sm text-muted-foreground">{copy.unavailable}<button onClick={() => image.refetch()} className="ml-2 underline">{shared.retry}</button></div>;
  if (!image.data) return <div role="status" className="p-3 text-sm text-muted-foreground">{shared.saving}</div>;
  return <img src={image.data.signed_url} alt={post.title} className={className} referrerPolicy="no-referrer" />;
}