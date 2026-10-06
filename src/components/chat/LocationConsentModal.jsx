import React, { useState } from 'react';
import { useLang } from '@/i18n/LanguageContext';
import LocationDialog from '@/features/location/components/LocationDialog';

export default function LocationConsentModal({ onChoose, onClose, busy, error }) {
  const { t } = useLang();
  const [agreed, setAgreed] = useState(false);
  return <LocationDialog title={t('consent.title')} description={t('consent.agreementTitle')} onClose={onClose} busy={busy}>
    <div className="rounded-xl border bg-background p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-[35dvh] overflow-y-auto" tabIndex={0}>
      {t('consent.agreement')}
    </div>
    <label className="flex items-start gap-2.5 mt-3 text-xs font-medium">
      <input type="checkbox" checked={agreed} disabled={busy} onChange={e => setAgreed(e.target.checked)} className="mt-0.5" />
      {t('consent.readAgree')}
    </label>
    {!agreed && <p className="text-xs text-muted-foreground mt-1">{t('consent.checkFirst')}</p>}
    {error && <p role="alert" className="text-xs text-destructive mt-2">{t('location.failed')}</p>}
    <div className="mt-4 space-y-2">
      {['always', 'session'].map(choice => <button key={choice} disabled={!agreed || busy} onClick={() => onChoose(choice)} className="w-full text-left px-4 py-2.5 rounded-xl border bg-secondary text-secondary-foreground disabled:opacity-40">
        <span className="block text-sm font-semibold">{t(`consent.${choice}`)}</span>
        <span className="block text-xs mt-0.5 text-muted-foreground">{t(`consent.${choice}Desc`)}</span>
      </button>)}
      <button disabled={busy} onClick={() => onChoose('denied')} className="w-full px-4 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground disabled:opacity-40">{busy ? t('location.saving') : t('consent.deny')}</button>
    </div>
  </LocationDialog>;
}