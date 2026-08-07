import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet markers in Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for the user's location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for barbers
const barberIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for selected barber
const selectedBarberIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  userLocation: { lat: number; lng: number };
  barbers: any[];
  activeBarberId: string | null;
  onBarberSelect: (id: string) => void;
}

function MapUpdater({ activeBarberId, barbers, userLocation }: any) {
  const map = useMap();
  useEffect(() => {
    if (activeBarberId) {
      const barber = barbers.find((b: any) => b.user_id === activeBarberId);
      if (barber) {
        map.setView([barber.latitude, barber.longitude], 15, { animate: true });
      }
    } else {
      map.setView([userLocation.lat, userLocation.lng], 13, { animate: true });
    }
  }, [activeBarberId, map, barbers, userLocation]);
  return null;
}

export default function MapComponent({ userLocation, barbers, activeBarberId, onBarberSelect }: MapComponentProps) {
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[userLocation.lat, userLocation.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-xs font-bold">Sizning joylashuvingiz</div>
          </Popup>
        </Marker>

        {/* Barbers Markers */}
        {barbers.map(barber => (
          <Marker 
            key={barber.user_id} 
            position={[barber.latitude, barber.longitude]}
            icon={activeBarberId === barber.user_id ? selectedBarberIcon : barberIcon}
            eventHandlers={{
              click: () => onBarberSelect(barber.user_id),
            }}
          >
            <Popup>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold">{barber.business_name}</span>
                <span className="text-[10px] text-primary font-semibold">{barber.starting_price.toLocaleString()} UZS</span>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapUpdater activeBarberId={activeBarberId} barbers={barbers} userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}
