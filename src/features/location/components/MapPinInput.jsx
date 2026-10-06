import React from 'react';
import { useMapEvents } from 'react-leaflet';
export default function MapPinInput({ onPick }) {
  useMapEvents({ click: event => onPick([event.latlng.lat, event.latlng.lng]) });
  return null;
}