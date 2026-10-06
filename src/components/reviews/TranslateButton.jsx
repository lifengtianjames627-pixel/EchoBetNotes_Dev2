import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import boardCopy from '@/components/reviews/boardCopy';

// Per-review translate control. Translates the review body into the reader's
// current system language on demand; the stored review is never modified.
export default function TranslateButton({ text, onResult }) {
  const { lang } = useLang();
  const copy = boardCopy(lang);
  const [state, setState] = useState('idle'); // idle | loading | shown | error
  const [translated, setTranslated] = useState('');

  const run = async () => {
    if (state === 'shown') { setState('idle'); onResult(null); return; }
    if (translated) { setState('shown'); onResult(translated); return; }
    setState('loading');
    try {
      const res = await base44.functions.invoke('translateText', { text, target: lang });
      const out = res.data?.translated;
      if (!out) throw new Error('empty');
      setTranslated(out);
      setState('shown');
      onResult(out);
    } catch (e) {
      setState('error');
      onResult(null);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); run(); }}
      disabled={state === 'loading' || !text}
      className="inline-flex items-center gap-1 text-xs font-semibold hover:underline disabled:opacity-60"
      style={{ color: '#bf7a35' }}
    >
      <Languages className="w-3.5 h-3.5" />
      {state === 'loading' ? copy.translating : state === 'shown' ? copy.showOriginal : state === 'error' ? copy.translateFailed : copy.translate}
    </button>
  );
}