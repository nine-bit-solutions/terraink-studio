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
    borderColor: '#EAEAEA'
  },
  dark: {
    id: 'dark',
    name: 'Dark Luxe',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#0D0D0D',
    lineColor: '#C9A84C', // Kudos Gold
    textColor: '#FFFFFF',
    borderColor: '#222222'
  },
  topo: {
    id: 'topo',
    name: 'Topo Contour',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty', // Fallback open style
    bg: '#F0EBE1',
    lineColor: '#2B4A8B',
    textColor: '#2B4A8B',
    borderColor: '#D8D1C5'
  },
  medal: {
    id: 'medal',
    name: 'Medal + Map',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    bg: '#FFFFFF',
    lineColor: '#C9A84C',
    textColor: '#111111',
    borderColor: '#CCCCCC'
  },
  photo: {
    id: 'photo',
    name: 'Photo + Map',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#111111',
    lineColor: '#FFFFFF',
    textColor: '#FFFFFF',
    borderColor: '#333333'
  }
};

export default function AppShell() {
  const mapRef = useRef<MapRef>(null);
  
  // 1. DATA COORDINATES STATE
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  
  // 2. FOUNDATIONAL DESIGN KNOBS
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof TEMPLATE_STYLES>('dark');
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [mapPadding, setMapPadding] = useState<number>(80);
  const [lineOpacity, setLineOpacity] = useState<number>(1);
  
  // 3. GRAPHIC LAYER TOGGLES
  const [showSplits, setShowSplits] = useState<boolean>(false);
  const [showMedalZone, setShowMedalZone] = useState<boolean>(false);

  // 4. TYPOGRAPHY / LABEL OVERLAYS
  const [runnerName, setRunnerName] = useState<string>('TEST RUNNER');
  const [raceName, setRaceName] = useState<string>('COMRADES MARATHON');
  const [raceYear, setRaceYear] = useState<string>('2026');
  const [finishTime, setFinishTime] = useState<string>('07:54:12');
  const [bibNumber, setBibNumber] = useState<string>('8421');
  const [customQuote, setCustomQuote] = useState<string>('Local is Lekker.');

  // Automatically recalculate map view borders when knobs update
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
        alert("Error loading run file. Check GPX format accuracy.");
      }
    }
  };

  const currentToken = TEMPLATE_STYLES[activeTemplate];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vw', maxHeight: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: '#F0F2F5' }}>
      
      {/* =========================================================
          THE FULL Side Control Panel (Foundational Features Restored)
          ========================================================= */}
      <div style={{ 
        width: '380px', 
        height: '100%', 
        background: '#FFFFFF', 
        borderRight: '1px solid #E2E8F0', 
        zIndex: 10, 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.03)',
        overflowY: 'auto'
      }}>
        
        {/* BRAND LABEL */}
        <div style={{ padding: '24px', borderBottom: '1px solid #EDF2F7', background: '#0F172A', color: '#FFFFFF' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>KUDOS PRO DASHBOARD</h1>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Factory Generation Matrix</p>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* STEP 1: GPX FILE UPLOAD */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>1. Track File Intake</label>
            <label style={{
              display: 'block', padding: '12px', background: '#C9A84C', color: 'white', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s'
            }}>
              {routeCoords.length > 0 ? "🔄 RELOAD RUN GEOMETRY" : "📂 CHOOSE RUN (.GPX)"}
              <input type="file" accept=".gpx" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* STEP 2: THE 5 LOCKED MASTER TEMPLATES */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>2. Master Guidelines Profiles</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.values(TEMPLATE_STYLES).map((style) => (
                <button
                  key={style.id}
                  onClick={() => setActiveTemplate(style.id as keyof typeof TEMPLATE_STYLES)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: activeTemplate === style.id ? '2px solid #C9A84C' : '1px solid #E2E8F0',
                    background: activeTemplate === style.id ? '#FDFBF7' : '#FFFFFF', color: '#1E293B', textAlign: 'left', fontWeight: activeTemplate === style.id ? 700 : 500, fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  {style.name}
                  {activeTemplate === style.id && <span style={{ color: '#C9A84C', fontSize: '11px' }}>● ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: HIGH-PRECISION DESIGN SLIDERS */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase' }}>3. Vector Geometry Fine-Tuning</label>
            
            {/* STROKE WIDTH SLIDER */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>Route Line Weight</span>
                <span>{strokeWidth}px</span>
              </div>
              <input type="range" min="1.5" max="8.0" step="0.1" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>

            {/* MARGIN BOUNDARY SLIDER */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>Layout Border Frame Padding</span>
                <span>{mapPadding}px</span>
              </div>
              <input type="range" min="40" max="150" step="5" value={mapPadding} onChange={(e) => setMapPadding(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>

            {/* PATH OPACITY SLIDER */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                <span>Path Ink Opacity</span>
                <span>{Math.round(lineOpacity * 100)}%</span>
              </div>
              <input type="range" min="0.2" max="1.0" step="0.05" value={lineOpacity} onChange={(e) => setLineOpacity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
          </div>

          {/* STEP 4: GRAPHIC LAYER TOGGLES */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>4. Overlays & Markers</label>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSplits} onChange={(e) => setShowSplits(e.target.checked)} style={{ accentColor: '#C9A84C', width: '16px', height: '16px' }} />
                Render KM Splits Nodes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMedalZone} onChange={(e) => setShowMedalZone(e.target.checked)} style={{ accentColor: '#C9A84C', width: '16px', height: '16px' }} />
                Reserve Physical Medal Safe-Zone
              </label>
            </div>
          </div>

          {/* STEP 5: CUSTOM LABELS TYPOGRAPHY OVERRIDE */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase' }}>5. Typography Labels & Metadata</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <input type="text" placeholder="Runner Full Name" value={runnerName} onChange={(e) => setRunnerName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
              <input type="text" placeholder="Race Event Title" value={raceName} onChange={(e) => setRaceName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Year" value={raceYear} onChange={(e) => setRaceYear(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
                <input type="text" placeholder="Bib Number" value={bibNumber} onChange={(e) => setBibNumber(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              
              <input type="text" placeholder="Official Timing" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px