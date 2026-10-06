import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Check } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';
import LocationDialog from '@/features/location/components/LocationDialog';
import MapPinInput from '@/features/location/components/MapPinInput';

export default function LocationPicker({ initialCenter, onConfirm, onClose, busy, error }) {
  const { t } = useLang();
  const [pin, setPin] = useState(initialCenter || null);
  const center = initialCenter || [35.6762, 139.6503];
  return <LocationDialog title={t('picker.title')} description={t('picker.help')} onClose={onClose} busy={busy}>
    <div className="rounded-xl overflow-hidden border h-[30dvh] min-h-40">
      <MapContainer center={center} zoom={initialCenter ? 16 : 13} maxZoom={19} className="h-full w-full bg-muted">
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="&copy; OpenStreetMap contributors" />
        <MapPinInput onPick={value => { if (!busy) setPin(value); }} />
        {pin && <CircleMarker center={pin} radius={9} pathOptions={{ color: 'hsl(var(--accent))', fillColor: 'hsl(var(--accent))', fillOpacity: 0.9 }} />}
      </MapContainer>
    </div>
    {error && <p role="alert" className="text-xs text-destructive mt-2">{t('location.failed')}</p>}
    <button disabled={!pin || busy} onClick={() => onConfirm(pin)} className="w-full mt-3 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:opacity-40">
      <Check className="w-4 h-4" /> {busy ? t('location.saving') : t('picker.confirm')}
    </button>
  </LocationDialog>;
}