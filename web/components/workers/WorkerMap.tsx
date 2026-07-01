'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const workerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type WorkerMapProps = {
  lat: number;
  lon: number;
  workerName: string;
  gpsFixValid: boolean;
};

export function WorkerMap({ lat, lon, workerName, gpsFixValid }: WorkerMapProps) {
  if (!gpsFixValid || (lat === 0 && lon === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-ink-100 text-sm text-ink-500">
        GPS belum mendapat fix lokasi. Pastikan device berada di area terbuka.
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-lg">
      <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]} icon={workerIcon}>
          <Popup>{workerName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
