export function validLocation(point) {
  return !!point && Number.isFinite(point.lat) && Math.abs(point.lat) <= 90
    && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180;
}
export function storedLocation(user) {
  const point = { lat: user.location_lat, lng: user.location_lng };
  return user.location_consent === 'always' && validLocation(point)
    ? { lat: Math.round(point.lat * 1000) / 1000, lng: Math.round(point.lng * 1000) / 1000 } : null;
}
export function networkAllowed(user) { return user.location_network_allowed === true; }