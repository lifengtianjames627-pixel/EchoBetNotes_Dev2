import React from 'react';
import { MapPin, Music2 } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';

export default function ConnectionChoices({ locationAllowed, hasBand, bandName, onChange }) {
  const { t } = useLang();
  return <section className="mt-7 space-y-3">
    <label className="flex gap-3 p-4 rounded-xl cursor-pointer" style={{ background: '#f6efe1', border: '1px solid #e0d8c8' }}><input type="checkbox" checked={locationAllowed} onChange={e => onChange('location', e.target.checked)} className="mt-0.5" /><span><span className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#1a1815' }}><MapPin className="w-4 h-4" style={{ color: '#bf7a35' }} /> {t('location.networkTitle')}</span><span className="block text-xs mt-1" style={{ color: '#6b6358' }}>{t('location.networkDescription')}</span></span></label>
    <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: '#f5f2ea', border: '1px solid #e6ddc9' }}><input type="checkbox" checked={hasBand} onChange={e => onChange('band', e.target.checked)} /><Music2 className="w-4 h-4" style={{ color: '#6f7a5a' }} /><span className="text-sm font-semibold" style={{ color: '#1a1815' }}>I’m already in a band</span></label>
    {hasBand && <input value={bandName} onChange={e => onChange('bandName', e.target.value)} placeholder="Band name" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }} />}
  </section>;
}