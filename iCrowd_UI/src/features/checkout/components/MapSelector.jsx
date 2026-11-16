import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, onSelect }) => {
  useMapEvents({
    click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      onSelect(coords);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const MapController = ({ targetPosition }) => {
  const map = useMap();
  useEffect(() => {
    if (targetPosition && Array.isArray(targetPosition) && targetPosition.length === 2) {
      const currentCenter = map.getCenter();
      const dist = Math.abs(currentCenter.lat - targetPosition[0]) + Math.abs(currentCenter.lng - targetPosition[1]);
      if (dist > 0.0001) {
        map.flyTo(targetPosition, Math.max(map.getZoom(), 14), { duration: 0.8 });
      }
    }
  }, [targetPosition, map]);
  return null;
};

const MapSelector = ({ selectedPosition, onLocationSelect }) => {
  // Default to Colombo, Sri Lanka
  const defaultCenter = [6.9271, 79.8612];
  const [position, setPosition] = useState(
    selectedPosition && Array.isArray(selectedPosition) ? selectedPosition : defaultCenter
  );

  useEffect(() => {
    if (
      selectedPosition &&
      Array.isArray(selectedPosition) &&
      selectedPosition.length === 2 &&
      selectedPosition[0] != null &&
      selectedPosition[1] != null
    ) {
      setPosition(selectedPosition);
    }
  }, [selectedPosition]);

  const handleSelect = (coords) => {
    setPosition(coords);
    if (onLocationSelect) {
      onLocationSelect(coords);
    }
  };

  useEffect(() => {
    if (onLocationSelect) {
      onLocationSelect(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
      <MapContainer 
        center={position || defaultCenter} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker position={position} onSelect={handleSelect} />
        <MapController targetPosition={position} />
      </MapContainer>
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-black shadow-md z-[400] text-center border border-gray-100 pointer-events-none flex items-center justify-center gap-2">
        <span>📍</span> Tap the map to choose your delivery location
      </div>
    </div>
  );
};

export default MapSelector;
