import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
    const [location, setLocationState] = useState(() => {
        // Initialize from localStorage if available (only in browser)
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userLocation');
            return saved || '';
        }
        return '';
    });
    
    const [coordinates, setCoordinatesState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userCoordinates');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Save location to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && location) {
            localStorage.setItem('userLocation', location);
        }
    }, [location]);

    // Save coordinates to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined' && coordinates) {
            localStorage.setItem('userCoordinates', JSON.stringify(coordinates));
        }
    }, [coordinates]);

    const setLocation = (newLocation) => {
        setLocationState(newLocation);
    };

    const setCoordinates = (coords) => {
        setCoordinatesState(coords);
    };

    const detectLocation = async () => {
        // Check if running in browser
        if (typeof window === 'undefined') {
            console.log('detectLocation called on server side, skipping');
            return;
        }

        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            alert('Geolocation is not supported by your browser');
            return;
        }

        console.log('Starting location detection...');
        setIsLoadingLocation(true);

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    console.log('Location obtained:', position.coords);
                    const { latitude, longitude } = position.coords;
                    setCoordinates({ latitude, longitude });
                    
                    try {
                        console.log('Fetching address from coordinates...');
                        // Use Nominatim API for reverse geocoding (free, no API key needed)
                        // Added User-Agent header as required by Nominatim usage policy
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                            {
                                headers: {
                                    'User-Agent': 'HelloDoctors/1.0'
                                }
                            }
                        );
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log('Reverse geocoding response:', data);
                            const address = data.address;
                            
                            // Create a readable location string
                            const locationParts = [
                                address.suburb || address.neighbourhood,
                                address.city || address.town || address.village,
                                address.state
                            ].filter(Boolean);
                            
                            const locationString = locationParts.join(', ');
                            const finalLocation = locationString || data.display_name;
                            
                            console.log('Final location:', finalLocation);
                            setLocation(finalLocation);
                            setIsLoadingLocation(false);
                            resolve(finalLocation);
                        } else {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                    } catch (error) {
                        console.error('Error getting location name:', error);
                        const fallbackLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                        console.log('Using fallback location:', fallbackLocation);
                        setLocation(fallbackLocation);
                        setIsLoadingLocation(false);
                        resolve(fallbackLocation);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setIsLoadingLocation(false);
                    
                    let errorMessage = '';
                    // Handle different error cases
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                            console.log('User denied location permission');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable.';
                            console.log('Location information unavailable');
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out.';
                            console.log('Location request timed out');
                            break;
                        default:
                            errorMessage = 'An unknown error occurred while detecting location.';
                            console.log('Unknown location error');
                    }
                    
                    alert(errorMessage);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };

    const clearLocation = () => {
        setLocationState('');
        setCoordinatesState(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userLocation');
            localStorage.removeItem('userCoordinates');
        }
    };

    const value = {
        location,
        setLocation,
        coordinates,
        setCoordinates,
        isLoadingLocation,
        detectLocation,
        clearLocation
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
