import React, { useState, useRef } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { parseGPX } from '@/utils/gpxParser';
import 'maplibre-gl/dist/maplibre-gl.css';

// Designer styles for Kudos Posters
const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark-matter"
};

export default function AppShell() {
  const mapRef = useRef<MapRef>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [activeStyle, setStyle] = useState<keyof typeof MAP_STYLES>('light');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const coords = await parseGPX(file);
        setRouteCoords(coords);

        if (coords.length > 0 && mapRef.current) {
          const lons = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          mapRef.current.fitBounds(
            [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
            { padding: 80, duration: 2000 }
          );
        }
      } catch (err) {
        alert("Error parsing GPX data.");
      }
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#f5f5f5' }}>
      
      {/* SIDEBAR: Design Controls */}
      <div style={{ width: '350px', padding: '30px', background: 'white', boxShadow: '2px 0 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '5px' }}>KUDOS STUDIO</h1>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '30px' }}>ASSET FACTORY v1.0</p>

        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>1. DATA INGESTION</p>
          <label style={{
            display: 'block', padding: '15px', background: activeStyle === 'dark' ? '#1a1a1a' : '#C9A84C',
            color: 'white', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            {routeCoords.length > 0 ? "CHANGE RUN DATA" : "UPLOAD GPX"}
            <input type="file" accept=".gpx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {routeCoords.length > 0 && (
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>2. POSTER STYLE</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={() => setStyle('light')}
                style={{ padding: '10px', borderRadius: '6px', border: activeStyle === 'light' ? '2px solid #C9A84C' : '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                Minimal White
              </button>
              <button 
                onClick={() => setStyle('dark')}
                style={{ padding: '10px', borderRadius: '6px', border: activeStyle === 'dark' ? '2px solid #C9A84C' : '1px solid #ddd', background: '#1a1a1a', color: 'white', cursor: 'pointer' }}>
                Dark Luxe
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CANVAS: The Map */}
      <div style={{ flex: 1, position: 'relative', padding: '40px' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
          <Map
            ref={mapRef}
            mapStyle={MAP_STYLES[activeStyle]}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            {routeCoords.length > 0 && (
              <Source id="route" type="geojson" data={{
                type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoords }
              }}>
                <Layer
                  id="route-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': activeStyle === 'dark' ? '#C9A84C' : '#1a1a1a',
                    'line-width': 4,
                    'line-opacity': 1
                  }}
                />
              </Source>
            )}
          </Map>
        </div>
      </div>
    </div>
  );
}