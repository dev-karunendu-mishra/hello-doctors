import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// City coordinates for Uttar Pradesh cities
const cityCoordinates = {
    'Agra': [27.1767, 78.0081],
    'Allahabad': [25.4358, 81.8463], // Prayagraj
    'Deoria': [26.5019, 83.7791],
    'Gorakhpur': [26.7606, 83.3732],
    'Kanpur': [26.4499, 80.3319],
    'Lucknow': [26.8467, 80.9462],
    'Mirzapur': [25.1460, 82.5690],
    'Varanasi': [25.3176, 82.9739],
};

// Create custom numbered marker icon
const createNumberedIcon = (count) => {
    const size = Math.min(Math.max(count / 50, 1), 3); // Scale based on doctor count
    const iconSize = 25 + (size * 5);
    
    return L.divIcon({
        html: `
            <div style="
                background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
                color: white;
                border-radius: 50%;
                width: ${iconSize}px;
                height: ${iconSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: ${iconSize > 35 ? '14px' : '12px'};
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 3px solid white;
            ">
                ${count}
            </div>
        `,
        className: 'custom-marker',
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
    });
};

// Component to fit bounds to markers
function FitBounds({ cities }) {
    const map = useMap();

    useEffect(() => {
        if (cities.length > 0) {
            const bounds = cities.map(city => {
                const coords = cityCoordinates[city.name];
                return coords ? coords : [26.8467, 80.9462]; // Default to Lucknow
            });
            
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [cities, map]);

    return null;
}

// Separate map component to avoid SSR issues
function MapComponent({ cities }) {
    const center = [26.8467, 80.9462]; // Center of UP (Lucknow)

    // Fix for default marker icon - only run on client
    useEffect(() => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    return (
        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <MapContainer
                center={center}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <FitBounds cities={cities} />

                {cities.map((city) => {
                    const position = cityCoordinates[city.name];
                    if (!position) return null;

                    return (
                        <Marker
                            key={city.id}
                            position={position}
                            icon={createNumberedIcon(city.doctors_count)}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center', padding: '4px' }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1890ff' }}>
                                        {city.name}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                                        {city.doctors_count} Doctors
                                    </p>
                                    <a
                                        href={`/search?city_name=${city.name}`}
                                        style={{
                                            display: 'inline-block',
                                            marginTop: '8px',
                                            padding: '4px 12px',
                                            background: '#1890ff',
                                            color: 'white',
                                            borderRadius: '4px',
                                            textDecoration: 'none',
                                            fontSize: '12px',
                                        }}
                                    >
                                        View Doctors
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

// Main component with SSR check
export default function IndiaMap({ cities }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Don't render map on server-side
    if (!isClient) {
        return (
            <div style={{ 
                height: '500px', 
                width: '100%', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f0f0'
            }}>
                <div style={{ fontSize: '16px', color: '#666' }}>Loading map...</div>
            </div>
        );
    }

    return <MapComponent cities={cities} />;
}
