// client/src/components/Indicators/IpGeolocationMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface Props {
  latitude: number;
  longitude: number;
  isp?: string;
  countryCode?: string;
  ipAddress?: string;
}

// Helper component to handle map updates when coordinates change
const MapUpdater: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lon]);
    // Force the map to recalculate its size after a short delay
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [lat, lon, map]);
  
  return null;
};

export const IpGeolocationMap: React.FC<Props> = ({ 
  latitude, 
  longitude, 
  isp, 
  countryCode,
  ipAddress 
}) => {
  const position: LatLngExpression = [latitude, longitude];

  return (
    <MapContainer
      center={position}
      zoom={10}
      scrollWheelZoom={false} // Disable scroll wheel zoom to prevent interference with page scrolling
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          <div style={{ minWidth: '200px' }}>
            {ipAddress && (
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#3b82f6' }}>
                📍 {ipAddress}
              </div>
            )}
            {countryCode && (
              <div style={{ marginBottom: '4px' }}>
                <strong>Country:</strong> {countryCode}
              </div>
            )}
            {isp && (
              <div style={{ marginBottom: '4px' }}>
                <strong>ISP:</strong> {isp}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              <strong>Coordinates:</strong><br />
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          </div>
        </Popup>
      </Marker>
      <MapUpdater lat={latitude} lon={longitude} />
    </MapContainer>
  );
};