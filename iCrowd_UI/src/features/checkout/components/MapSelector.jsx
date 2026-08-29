import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const MapSelector = ({ onLocationSelect }) => {
  // Default to Colombo, Sri Lanka
  const defaultCenter = [6.9271, 79.8612];
  const [position, setPosition] = useState(defaultCenter);

  useEffect(() => {
    onLocationSelect(position);
  }, [position, onLocationSelect]);

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker position={position} setPosition={setPosition} />
      </MapContainer>
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium text-black shadow-md z-[400] text-center border border-gray-100 pointer-events-none">
        Click on the map to place your delivery pin
      </div>
    </div>
  );
};

export default MapSelector;
