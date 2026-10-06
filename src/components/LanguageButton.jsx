import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';
import { LANGUAGES } from '@/i18n/translations';

// Dropdown that switches the SYSTEM language only — user content is untouched.
export default function LanguageButton() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={t('common.language')}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
        style={{ color: '#6b6358', border: '1px solid rgba(26,24,21,0.14)' }}
      >
        <Globe className="w-3.5 h-3.5" /> {current.flag} <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open && (
        <div className="fixed right-3 top-16 py-1.5 z-[300] min-w-[170px] max-h-[70vh] overflow-y-auto"
          style={{ background: '#faf8f2', border: '1px solid #e0d9c8', boxShadow: '0 8px 30px rgba(120,100,80,0.14)' }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-left transition-colors hover:bg-black/5"
              style={{ color: l.code === lang ? '#bf7a35' : '#5a5a5a' }}
            >
              <span>{l.flag}</span>
              <span className="flex-1 font-medium">{l.label}</span>
              {l.code === lang && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}