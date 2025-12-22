// Example of how to use the global location in any component

import { useLocation } from '@/Contexts/LocationContext';

export default function ExampleComponent() {
    const { 
        location,           // Current location string
        setLocation,        // Function to update location
        coordinates,        // Latitude and longitude {latitude, longitude}
        isLoadingLocation,  // Boolean - true while detecting location
        detectLocation,     // Function to trigger location detection
        clearLocation       // Function to clear location data
    } = useLocation();

    return (
        <div>
            <h2>Current Location: {location || 'Not set'}</h2>
            
            {coordinates && (
                <p>
                    Coordinates: {coordinates.latitude}, {coordinates.longitude}
                </p>
            )}
            
            <button onClick={detectLocation} disabled={isLoadingLocation}>
                {isLoadingLocation ? 'Detecting...' : 'Detect My Location'}
            </button>
            
            <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Or enter manually"
            />
            
            <button onClick={clearLocation}>
                Clear Location
            </button>
        </div>
    );
}

// Usage in any component:
// 1. Import the hook: import { useLocation } from '@/Contexts/LocationContext';
// 2. Use it: const { location, setLocation } = useLocation();
// 3. The location is automatically saved to localStorage and persists across page refreshes
