import React, { useEffect, useEffectEvent, useRef } from 'react';
import L from 'leaflet';

/**
 * InteractiveMapPicker Component
 * Renders a Leaflet map centered on Sri Lanka / selected coordinates.
 * Allows user to click or drag marker to set Latitude and Longitude.
 */
const InteractiveMapPicker = ({
    latitude = 6.9271, // Colombo default
    longitude = 79.8612,
    onChange
}) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // Initial lat/lng values
    const currentLat = latitude ? parseFloat(latitude) : 6.9271;
    const currentLng = longitude ? parseFloat(longitude) : 79.8612;

    const reportChange = useEffectEvent((lat,lng) => onChange?.(lat,lng));
    const [initialCenter] = React.useState([currentLat,currentLng]);
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Custom clean SVG pin icon
        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    background: #000000;
                    color: white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    border: 2px solid white;
                ">
                    <svg style="transform: rotate(45deg); width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34]
        });

        // Initialize map if not already done
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: initialCenter,
                zoom: 13,
                zoomControl: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            const marker = L.marker(initialCenter, {
                icon: customIcon,
                draggable: true
            }).addTo(map);

            // Handle marker drag
            marker.on('dragend', (e) => {
                const position = e.target.getLatLng();
                reportChange(position.lat.toFixed(6), position.lng.toFixed(6));
            });

            // Handle map click
            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                reportChange(lat.toFixed(6), lng.toFixed(6));
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;

            // Invalidate size in case of modal animation
            setTimeout(() => {
                map.invalidateSize();
            }, 250);
        } else {
            // Update center and marker if coordinates change from parent
            mapInstanceRef.current.setView(initialCenter, mapInstanceRef.current.getZoom());
            if (markerRef.current) {
                markerRef.current.setLatLng(initialCenter);
            }
        }

    return () => {
            // Cleanup on unmount
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, [initialCenter]);
    useEffect(() => {
        mapInstanceRef.current?.setView([currentLat,currentLng],mapInstanceRef.current.getZoom());
        markerRef.current?.setLatLng([currentLat,currentLng]);
    },[currentLat,currentLng]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Click map or drag pin to select exact delivery point
                </span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-700">
                    {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                </span>
            </div>

            <div
                ref={mapContainerRef}
                className="w-full h-56 rounded-xl border border-gray-300 overflow-hidden shadow-inner relative z-0"
            />
        </div>
    );
};

export default InteractiveMapPicker;
