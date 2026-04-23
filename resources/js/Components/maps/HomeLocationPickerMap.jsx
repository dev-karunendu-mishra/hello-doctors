import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_MAP_CENTER = [25.4358, 81.8463];

if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

function HomeMapViewport({ position, isVisible }) {
    const map = useMap();

    useEffect(() => {
        if (!isVisible) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            map.invalidateSize();

            if (position) {
                map.setView([position.lat, position.lng], Math.max(map.getZoom(), 14), {
                    animate: true,
                });
            }
        }, 180);

        return () => window.clearTimeout(timer);
    }, [isVisible, map, position]);

    return null;
}

function HomeLocationSelectionMarker({ position, onSelect }) {
    useMapEvents({
        click(event) {
            onSelect({
                lat: event.latlng.lat,
                lng: event.latlng.lng,
            });
        },
    });

    if (!position) {
        return null;
    }

    return (
        <Marker
            position={[position.lat, position.lng]}
            draggable
            eventHandlers={{
                dragend: (event) => {
                    const { lat, lng } = event.target.getLatLng();
                    onSelect({ lat, lng });
                },
            }}
        />
    );
}

export default function HomeLocationPickerMap({ position, onSelect, isVisible }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="home-map-picker-placeholder">Loading map...</div>;
    }

    const center = position ? [position.lat, position.lng] : DEFAULT_MAP_CENTER;

    return (
        <div className="home-map-picker-canvas">
            <MapContainer center={center} zoom={position ? 14 : 7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HomeMapViewport position={position} isVisible={isVisible} />
                <HomeLocationSelectionMarker position={position} onSelect={onSelect} />
            </MapContainer>
        </div>
    );
}
