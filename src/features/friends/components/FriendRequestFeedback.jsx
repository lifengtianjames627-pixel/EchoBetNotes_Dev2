import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LanguageContext';
import friendCopy from '@/features/friends/i18n/friendCopy';

export default function FriendRequestFeedback({ query = null, mutation = null, incoming = false }) {
  const { lang } = useLang();
  const copy = friendCopy(lang);
  const code = mutation?.error?.response?.data?.error;
  const errorCopy = { member_unavailable: copy.unavailable, self_request: copy.self,
    already_resolved: copy.conflict, invalid_message: copy.invalid };
  return <>
    {query?.isLoading && <p role="status" className="text-xs text-muted-foreground">{copy.loading}</p>}
    {query?.isError && <p role="alert" className="text-xs text-destructive">{copy.loadFailed} <button type="button" className="underline" onClick={() => query.refetch()}>{copy.retry}</button></p>}
    {mutation?.isError && <p role="alert" className="text-xs text-destructive">{errorCopy[code] || copy.failed}</p>}
    {incoming && <Link to="/profile" className="block text-xs text-foreground underline">{copy.incoming}</Link>}
  </>;
}