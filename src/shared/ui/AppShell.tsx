import React, { useState, useRef } from 'react';
import Map, { Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import { parseGPX } from '@/utils/gpxParser';
import Sidebar from '@/shared/ui/Sidebar'; // Keeps your existing Sidebar
import 'maplibre-gl/dist/maplibre-gl.css';

export default function AppShell() {
  const mapRef = useRef<MapRef>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // This function handles the file and moves the map
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const coords = await parseGPX(file);
        setRouteCoords(coords);

        // Calculate the "Center" of the run so the map can fly there
        if (coords.length > 0 && mapRef.current) {
          const lons = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);

          mapRef.current.fitBounds(
            [minLon, minLat, maxLon, maxLat],
            { padding: 100, duration: 2000 }
          );
        }
      } catch (err) {
        alert("Error reading GPX. Ensure it's a valid export.");
      }
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. THE SIDEBAR (Your Design Control Center) */}
      <div style={{ width: '350px', height: '100%', borderRight: '1px solid #ddd', zIndex: 10 }}>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '10px' }}>Kudos Studio</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            Transforming GPS data into minimalist art.
          </p>
          
          <label style={{
            display: 'block',
            padding: '12px',
            background: '#C9A84C', // Kudos Gold
            color: 'white',
            textAlign: 'center',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            UPLOAD RUN DATA (.GPX)
            <input type="file" accept=".gpx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
        {/* Placeholder for your original sidebar components */}
        <Sidebar /> 
      </div>

      {/* 2. THE MAP (Your Art Canvas) */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 31.02, // Durban / KZN Default
            latitude: -29.85,
            zoom: 11
          }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />

          {/* THE MAGIC: Drawing the Runner's Path */}
          {routeCoords.length > 0 && (
            <Source id="my-route" type="geojson" data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoords
              }
            }}>
              <Layer
                id="route-line-main"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#C9A84C', // Official Kudos Gold
                  'line-width': 5,
                  'line-opacity': 0.9
                }}
              />
            </Source>
          )}
        </Map>

        {/* PRINT BUTTON */}
        {routeCoords.length > 0 && (
          <button 
            onClick={() => window.print()}
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              padding: '15px 30px',
              background: 'white',
              border: '2px solid #1a1a1a',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            PREPARE PRINT ASSET
          </button>
        )}
      </div>
    </div>
  );
}