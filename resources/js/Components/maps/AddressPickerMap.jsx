import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_MAP_CENTER = [20.5937, 78.9629];

if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

function MapViewportUpdater({ position, isVisible }) {
    const map = useMap();

    useEffect(() => {
        if (!isVisible) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            map.invalidateSize();

            if (position) {
                map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16), {
                    animate: true,
                });
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [map, position, isVisible]);

    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16), {
                animate: true,
            });
        }
    }, [map, position]);

    return null;
}

function LocationSelectionMarker({ position, onChange }) {
    useMapEvents({
        click(event) {
            onChange({
                lat: event.latlng.lat,
                lng: event.latlng.lng,
            }, true);
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
                    onChange({ lat, lng }, true);
                },
            }}
        />
    );
}

export default function AddressPickerMap({ position, isVisible, onChange }) {
    return (
        <div style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <MapContainer
                center={position ? [position.lat, position.lng] : DEFAULT_MAP_CENTER}
                zoom={position ? 16 : 5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewportUpdater position={position} isVisible={isVisible} />
                <LocationSelectionMarker position={position} onChange={onChange} />
            </MapContainer>
        </div>
    );
}
