const WINDOW_MS = 20000;
export default function watchLocation({ onAccuracy, onResult, onError }) {
  let active = true, best = null, watchId = null, timer = null;
  const stop = () => {
    active = false;
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    clearTimeout(timer);
  };
  const finish = () => {
    if (!active) return;
    stop();
    if (!best) onError('denied');
    else if (best.acc > 500) onError('imprecise');
    else onResult(best);
  };
  timer = setTimeout(finish, WINDOW_MS);
  watchId = navigator.geolocation.watchPosition(pos => {
    if (!active) return;
    const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
    if (!best || acc < best.acc) { best = { lat, lng, acc }; onAccuracy(Math.round(acc)); }
    if (acc <= 60) finish();
  }, error => {
    if (!active) return;
    if (error.code !== 1 && best) { finish(); return; }
    stop();
    onError('denied');
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: WINDOW_MS });
  return stop;
}