import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import privacyCopy from '@/features/soulmate/i18n/privacyCopy';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';
export default function PrivatePosterUpload({ onChange, onUploading, disabled }) {
  const { lang } = useLang();
  const copy = privacyCopy(lang), shared = recruitCopy(lang);
  const [file, setFile] = useState(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const upload = async selected => {
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024) { setError(copy.invalidImage); return; }
    setBusy(true); onUploading(true); setError('');
    try {
      const { data } = await base44.functions.invoke('uploadRecruitPoster', { file: selected });
      onChange(data.asset_id); setFile(selected);
    } catch (e) { setError(e.response?.data?.error === 'INVALID_IMAGE' ? copy.invalidImage : shared.failed); }
    finally { setBusy(false); onUploading(false); }
  };
  return <div className="space-y-2 text-card-foreground bg-card rounded-lg p-3">
    {preview && <img src={preview} alt={copy.upload} className="w-full aspect-[4/3] object-contain" />}
    <label className="block text-sm font-medium">{busy ? copy.uploading : copy.upload}
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || disabled} onChange={e => upload(e.target.files?.[0])} className="block w-full min-w-0 mt-2 text-xs" />
    </label>
    <p className="text-xs text-muted-foreground">{copy.imageHint}</p>
    {file && <button type="button" disabled={busy || disabled} onClick={() => { setFile(null); onChange(''); }} className="text-xs underline">{copy.remove}</button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}