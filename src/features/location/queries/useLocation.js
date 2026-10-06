import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { saveLocation, revokeLocation } from '@/features/location/api/locationPreferences';
import { setSessionLocation } from '@/features/location/model/sessionLocation';
import watchLocation from '@/features/location/model/watchLocation';

export default function useLocation() {
  const client = useQueryClient();
  const [status, setStatus] = useState('idle');
  const [accuracy, setAccuracy] = useState(null);
  const cancel = useRef(() => {}), generation = useRef(0), queue = useRef(Promise.resolve());
  const stop = useCallback(() => { generation.current++; cancel.current(); cancel.current = () => {}; }, []);
  useEffect(() => stop, [stop]);
  const write = useCallback((operation, token) => {
    setStatus('saving');
    const task = queue.current.then(operation).then(async result => {
      if (token !== generation.current) return false;
      setSessionLocation(result.session || null);
      client.setQueryData(['me'], result.user);
      await client.cancelQueries({ queryKey: ['chat-directory'] });
      await client.invalidateQueries({ queryKey: ['chat-directory'] });
      setStatus(result.revoked ? 'idle' : 'done');
      return true;
    }).catch(() => { if (token === generation.current) setStatus('error'); return false; });
    queue.current = task;
    return task;
  }, [client]);
  const share = useCallback(consent => {
    if (!['session', 'always'].includes(consent)) return;
    stop();
    if (!navigator.geolocation) { setStatus('unsupported'); return; }
    const token = generation.current;
    setStatus('asking'); setAccuracy(null);
    cancel.current = watchLocation({
      onAccuracy: setAccuracy,
      onResult: point => { if (token === generation.current) write(() => saveLocation({ point, consent, source: 'device' }), token); },
      onError: state => { if (token === generation.current) setStatus(state); },
    });
  }, [stop, write]);
  const setManual = useCallback(([lat, lng], consent) => {
    stop(); setAccuracy(null);
    return write(() => saveLocation({ point: { lat, lng }, consent, source: 'manual' }), generation.current);
  }, [stop, write]);
  const clear = useCallback(() => {
    stop(); setAccuracy(null); setSessionLocation(null);
    return write(async () => ({ user: await revokeLocation(), revoked: true }), generation.current);
  }, [stop, write]);
  return { status, accuracy, share, setManual, clear, deny: clear };
}