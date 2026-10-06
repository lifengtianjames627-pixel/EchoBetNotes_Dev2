import { base44 } from '@/api/base44Client';
export const emptyLocation = {
  location_lat: null, location_lng: null, location_accuracy_m: null,
  location_updated: null, location_source: null,
};
export const roundCoordinate = value => Math.round(value * 1000) / 1000;
export async function saveLocation({ point, consent, source }) {
  if (!['session', 'always'].includes(consent)) throw new Error('Consent required');
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) throw new Error('Invalid location');
  const location = { lat: roundCoordinate(point.lat), lng: roundCoordinate(point.lng), source };
  const user = await base44.auth.updateMe(consent === 'session'
    ? { ...emptyLocation, location_consent: 'session' }
    : { location_lat: location.lat, location_lng: location.lng, location_source: source,
      location_accuracy_m: source === 'manual' ? null : Math.round(point.acc),
      location_consent: consent, location_updated: new Date().toISOString() });
  return { user, session: consent === 'session' ? { ...location, userId: user.id } : null };
}
export async function revokeLocation() {
  return base44.auth.updateMe({ ...emptyLocation, location_consent: 'denied',
    location_network_allowed: false, network_id: null, network_seen: null });
}