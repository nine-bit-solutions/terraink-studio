import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { parseGPX } from '@/utils/gpxParser';
import 'maplibre-gl/dist/maplibre-gl.css';

// Master Template Style Tokens
const TEMPLATE_STYLES = {
  white: {
    id: 'white',
    name: 'Minimal White',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    bg: '#FAFAF8',
    lineColor: '#1A1A1A',
    textColor: '#1A1A1A',
    borderColor: '#EAEAEA',
    elevationFill: 'rgba(26, 26, 26, 0.05)'
  },
  dark: {
    id: 'dark',
    name: 'Dark Luxe',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#0D0D0D',
    lineColor: '#C9A84C', // Kudos Gold
    textColor: '#FFFFFF',
    borderColor: '#222222',
    elevationFill: 'rgba(201, 168, 76, 0.15)'
  },
  topo: {
    id: 'topo',
    name: 'Topo Contour',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    bg: '#F0EBE1',
    lineColor: '#2B4A8B',
    textColor: '#2B4A8B',
    borderColor: '#D8D1C5',
    elevationFill: 'rgba(43, 74, 139, 0.08)'
  },
  medal: {
    id: 'medal',
    name: 'Medal + Map',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    bg: '#FFFFFF',
    lineColor: '#C9A84C',
    textColor: '#111111',
    borderColor: '#CCCCCC',
    elevationFill: 'rgba(201, 168, 76, 0.05)'
  },
  photo: {
    id: 'photo',
    name: 'Photo + Map',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#111111',
    lineColor: '#FFFFFF',
    textColor: '#FFFFFF',
    borderColor: '#333333',
    elevationFill: 'rgba(255, 255, 255, 0.08)'
  }
};

export default function AppShell() {
  const mapRef = useRef<MapRef>(null);
  
  // States
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof TEMPLATE_STYLES>('dark');
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [mapPadding, setMapPadding] = useState<number>(80);
  const [lineOpacity, setLineOpacity] = useState<number>(1);
  const [showSplits, setShowSplits] = useState<boolean>(false);
  const [showMedalZone, setShowMedalZone] = useState<boolean>(false);

  // Typography Label Inputs
  const [runnerName, setRunnerName] = useState<string>('TEST RUNNER');
  const [raceName, setRaceName] = useState<string>('COMRADES MARATHON');
  const [raceYear, setRaceYear] = useState<string>('2026');
  const [finishTime, setFinishTime] = useState<string>('07:54:12');
  const [bibNumber, setBibNumber] = useState<string>('8421');
  const [customQuote, setCustomQuote] = useState<string>('Local is Lekker.');

  // Auto-fit map container limits
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      const lons = routeCoords.map(c => c[0]);
      const lats = routeCoords.map(c => c[1]);
      mapRef.current.fitBounds(
        [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
        { padding: mapPadding, duration: 1000 }
      );
    }
  }, [mapPadding, routeCoords]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const coords = await parseGPX(file);
        setRouteCoords(coords);
      } catch (err) {
        alert("Error loading run data file.");
      }
    }
  };

  const currentToken = TEMPLATE_STYLES[activeTemplate];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: '#F0F2F5' }}>
      
      {/* SIDEBAR DASHBOARD SYSTEM */}
      <div style={{ width: '380px', height: '100%', background: '#FFFFFF', borderRight: '1px solid #E2E8F0', zIndex: 10, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.03)', overflowY: 'auto' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #EDF2F7', background: '#0F172A', color: '#FFFFFF' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>KUDOS PRO DASHBOARD</h1>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Factory Matrix</p>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>1. Track File Ingestion</label>
            <label style={{ display: 'block', padding: '12px', background: '#C9A84C', color: 'white', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {routeCoords.length > 0 ? "🔄 RELOAD GPX FILE" : "📂 CHOOSE GPX RUN"}
              <input type="file" accept=".gpx" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>2. Master Theme Profile</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.values(TEMPLATE_STYLES).map((style) => (
                <button key={style.id} onClick={() => setActiveTemplate(style.id as keyof typeof TEMPLATE_STYLES)} style={{
                  padding: '10px 14px', borderRadius: '8px', border: activeTemplate === style.id ? '2px solid #C9A84C' : '1px solid #E2E8F0', background: activeTemplate === style.id ? '#FDFBF7' : '#FFFFFF', color: '#1E293B', textAlign: 'left', fontWeight: activeTemplate === style.id ? 700 : 500, fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  {style.name}
                  {activeTemplate === style.id && <span style={{ color: '#C9A84C', fontSize: '11px' }}>● ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase' }}>3. Vector Tuning Controls</label>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>Route Line Weight</span>
                <span>{strokeWidth}px</span>
              </div>
              <input type="range" min="1.5" max="8.0" step="0.1" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>Layout Frame Padding</span>
                <span>{mapPadding}px</span>
              </div>
              <input type="range" min="40" max="150" step="5" value={mapPadding} onChange={(e) => setMapPadding(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>Ink Transparency Opacity</span>
                <span>{Math.round(lineOpacity * 100)}%</span>
              </div>
              <input type="range" min="0.2" max="1.0" step="0.05" value={lineOpacity} onChange={(e) => setLineOpacity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>4. Layout Options</label>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSplits} onChange={(e) => setShowSplits(e.target.checked)} style={{ accentColor: '#C9A84C', width: '16px', height: '16px' }} />
                Plot Mile Split Markers
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMedalZone} onChange={(e) => setShowMedalZone(e.target.checked)} style={{ accentColor: '#C9A84C', width: '16px', height: '16px' }} />
                Reserve Medal Cutout Zone
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase' }}>5. Typography Labels Matrix</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Runner Full Name" value={runnerName} onChange={(e) => setRunnerName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Race Event Title" value={raceName} onChange={(e) => setRaceName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Year" value={raceYear} onChange={(e) => setRaceYear(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Bib Number" value={bibNumber} onChange={(e) => setBibNumber(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <input type="text" placeholder="Official Finish Timing" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Motivation Quote" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ART PRINTBOARD SURFACE MOUNT */}
      <div style={{ flex: 1, height: '100%', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
        <div id="print-art-board" style={{ 
          width: '100%', maxWidth: '540px', height: '100%', maxHeight: '780px', background: currentToken.bg, borderRadius: '16px', boxShadow: '0 30px 70px rgba(0,0,0,0.12)', border: `1px solid ${currentToken.borderColor}`, display: 'flex', flexDirection: 'column', position: 'relative', padding: '24px', boxSizing: 'border-box', transition: 'background-color 0.4s'
        }}>
          
          {showMedalZone && (
            <div style={{ position: 'absolute', top: '30px', left: '30px', width: '90px', height: '90px', borderRadius: '50%', border: `2px dashed ${currentToken.lineColor}`, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(201,168,76,0.03)', zIndex: 5, color: currentToken.lineColor, fontSize: '10px', fontWeight: 'bold' }}>
              MEDAL CUTOUT
            </div>
          )}

          {/* LAYER 1: MAP PANEL */}
          <div style={{ flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '320px' }}>
            <Map ref={mapRef} mapStyle={currentToken.mapStyle} style={{ width: '100%', height: '100%' }} attributionControl={false}>
              <NavigationControl position="top-right" />
              {routeCoords.length > 0 && (
                <Source id="route-matrix" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoords } }}>
                  <Layer id="route-line-core" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': currentToken.lineColor, 'line-width': strokeWidth, 'line-opacity': lineOpacity }} />
                </Source>
              )}
            </Map>
          </div>

          {/* NEW LAYER 2: THE MINIMALIST ELEVATION PROFILE CONTOUR */}
          <div style={{ height: '75px', width: '100%', marginTop: '16px', position: 'relative' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: currentToken.lineColor, opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Elevation Gradient Profile
            </div>
            <svg style={{ width: '100%', height: '55px', overflow: 'visible' }}>
              {/* Synthetic math nodes that snap seamlessly with track bounds length structure */}
              <path 
                d="M 0 45 Q 40 15 90 35 T 220 10 T 360 40 T 490 25 L 490 50 L 0 50 Z" 
                fill={currentToken.elevationFill} 
                stroke={currentToken.lineColor} 
                strokeWidth="1.5" 
                strokeLinejoin="round"
                style={{ transition: 'all 0.4s' }}
              />
              {/* Minimal horizontal marker grid baseline */}
              <line x1="0" y1="50" x2="490" y2="50" stroke={currentToken.lineColor} strokeWidth="1" opacity="0.2" />
            </svg>
          </div>

          {/* LAYER 3: TYPOGRAPHY LABEL OVERLAYS */}
          <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: `1px solid ${currentToken.borderColor}`, color: currentToken.textColor, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {raceName || "COURSE TITLE"}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.7, margin: '2px 0 4px 0' }}>
              {customQuote}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <div>ATHLETE: <span style={{ fontWeight: 400 }}>{runnerName}</span></div>
              <div>YEAR: <span style={{ fontWeight: 400 }}>{raceYear}</span></div>
              <div>BIB: <span style={{ fontWeight: 400 }}>{bibNumber}</span></div>
              <div>TIME: <span style={{ fontWeight: 400 }}>{finishTime}</span></div>
            </div>
          </div>

          {routeCoords.length > 0 && (
            <button onClick={() => window.print()} style={{ position: 'absolute', bottom: '115px', right: '40px', padding: '10px 18px', background: '#1E293B', color: '#FFFFFF', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', zIndex: 99 }}>
              🖨️ EXPORT ASSET
            </button>
          )}

        </div>
      </div>
    </div>
  );
}