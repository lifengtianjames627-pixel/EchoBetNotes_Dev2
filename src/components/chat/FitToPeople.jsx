import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Keeps every marker inside the frame. Without this the map stayed locked at a
// fixed zoom around the viewer, so anyone more than a few hundred metres away
// was rendered outside the visible area and looked "missing".
export default function FitToPeople({ points }) {
  const map = useMap();
  const key = points.map(p => p.join(',')).join('|');

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }
    map.fitBounds(points, { padding: [36, 36], maxZoom: 17 });
  }, [key, map]);

  return null;
}