import { useState, useEffect } from 'react';

// True on phone-width screens (below Tailwind's md). Used to turn the fixed
// sidebar into a slide-over drawer so the content gets the full screen width.
export function useIsMobile(query = '(max-width: 767px)') {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}