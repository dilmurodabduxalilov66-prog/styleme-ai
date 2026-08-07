'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';

// Fix for default marker icons in Leaflet with webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function LocateControl({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Brauzeringiz joylashuvni aniqlashni qo'llab-quvvatlamaydi.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        map.flyTo([latitude, longitude], 15);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        alert("Joylashuvni aniqlab bo'lmadi. Iltimos, ruxsat berganingizni tekshiring.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, position: 'absolute', top: '10px', right: '10px' }}>
      <button 
        onClick={(e) => { e.preventDefault(); locateUser(); }}
        disabled={locating}
        className="bg-bg-surface hover:bg-bg-surfaceHover text-text-primary p-2 rounded shadow-md flex items-center justify-center border border-border-glass transition-colors"
        title="Mening joylashuvim"
        type="button"
      >
        {locating ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <LocateFixed className="h-5 w-5 text-primary" />}
      </button>
    </div>
  );
}

export default function MapSelector({ initialPosition, onPositionChange }: { initialPosition?: [number, number], onPositionChange: (lat: number, lng: number) => void }) {
  // Default to Tashkent coordinates if no initial position is provided
  const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
  const defaultCenter: [number, number] = initialPosition || [41.2995, 69.2401];

  useEffect(() => {
    if (position) {
      onPositionChange(position[0], position[1]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-glass)', position: 'relative' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
        <LocateControl setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
