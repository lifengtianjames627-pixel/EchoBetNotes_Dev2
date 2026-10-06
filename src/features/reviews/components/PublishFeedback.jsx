import React from 'react';
import { useLang } from '@/i18n/LanguageContext';
import publishCopy from '@/features/reviews/model/publishCopy';

export default function PublishFeedback({ pending, error }) {
  const { lang } = useLang();
  const copy = publishCopy(lang);
  return <>
    {pending && <p role="status" className="text-sm text-muted-foreground">{copy.pending}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error.message === 'BLOCKED' ? copy.blocked : copy.failed}</p>}
  </>;
}