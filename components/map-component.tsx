"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';

// We'll wrap the whole MapComponent in a dynamic import from the parent page instead
// to ensure all Leaflet/React-Leaflet parts run only on the client.

interface MapComponentProps {
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    // userCoordinates: { lat: number; lng: number } | null;
}

// Internal helper for coordinate conversion (Placeholder until reference points are provided)
// This will eventually map [World GPS] -> [Image Pixels]
const GPS_REFERENCE_POINTS = [
    // { gps: [17.xxx, 78.xxx], pixel: [x, y] }
];

export default function MapComponent({ imageUrl, imageWidth, imageHeight }: MapComponentProps) {
    const [L, setL] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        // Load Leaflet on client side
        import('leaflet').then((leaflet) => {
            setL(leaflet.default);

            // Fix marker icon issues
            delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
            leaflet.default.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        });

        // Watch user location
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // For now, we store raw GPS. We'll need the transform function 
                    // once reference points are provided to map it to the image bounds.
                    setUserLocation([latitude, longitude]);
                },
                (error) => console.error("Geolocation error:", error),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    if (!L) return <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">Initializing Map...</div>;

    // Standard CRS.Simple setup for non-geographic maps (like AutoCAD layouts)
    const bounds: [number, number][] = [[0, 0], [imageHeight, imageWidth]];

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-brand-blue/10 shadow-inner bg-brand-cream/10">
            <MapContainer
                crs={L.CRS.Simple}
                bounds={bounds}
                maxZoom={2}
                minZoom={-2}
                className="w-full h-full"
                attributionControl={false}
            >
                <ImageOverlay
                    url={imageUrl}
                    bounds={bounds}
                />

                {/* 
                    BLUE DOT - REQUIRES TRANSFORM 
                    Once we have 2-3 reference GPS points, we will create a 
                    projection function that maps userLocation (GPS) -> pixels on map.
                */}
                {userLocation && (
                    <Marker position={[imageHeight / 2, imageWidth / 2]}> {/* Dummy position */}
                        <Popup>You are here (calibrating...)</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
