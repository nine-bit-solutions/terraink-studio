import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 5 Locked Master Guidelines Token Profiles
const TEMPLATE_STYLES = {
  white: {
    id: 'white',
    name: 'Minimal White',
    mapStyle: 'https://tiles.openfreemap.org/styles/positron',
    bg: '#FAFAF8',
    lineColor: '#1A1A1A',
    textColor: '#1A1A1A',
    borderColor: '#EAEAEA',
    elevationFill: 'rgba(26, 26, 26, 0.06)',
    hasElevation: true,
    layoutMode: 'standard'
  },
  dark: {
    id: 'dark',
    name: 'Dark Luxe',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#0D0D0D',
    lineColor: '#C9A84C', // Kudos Gold
    textColor: '#FFFFFF',
    borderColor: '#222222',
    elevationFill: 'rgba(201, 168, 76, 0.16)',
    hasElevation: true,
    layoutMode: 'standard'
  },
  topo: {
    id: 'topo',
    name: 'Topo Contour',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    bg: '#F0EBE1',
    lineColor: '#2B4A8B',
    textColor: '#2B4A8B',
    borderColor: '#D8D1C5',
    elevationFill: 'rgba(43, 74, 139, 0.10)',
    hasElevation: true,
    layoutMode: 'standard'
  },
  medal: {
    id: 'medal',
    name: 'Medal + Map (Trophy Frame)',
    mapStyle: 'https://tiles.openfreemap.org/styles/positron',
    bg: '#FFFFFF',
    lineColor: '#C9A84C',
    textColor: '#111111',
    borderColor: '#E2E8F0',
    elevationFill: 'transparent',
    hasElevation: false,
    layoutMode: 'medal'
  },
  photo: {
    id: 'photo',
    name: 'Photo + Map Split Layout',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#111111',
    lineColor: '#FFFFFF',
    textColor: '#FFFFFF',
    borderColor: '#2A2A2A',
    elevationFill: 'transparent',
    hasElevation: false,
    layoutMode: 'split-photo'
  }
};

export default function AppShell() {
  const mapRef = useRef<any>(null);
  
  // Ingestion Stream States
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [elevationPath, setElevationPath] = useState<string>('');
  
  // Extracted Data Metrics State
  const [computedDistance, setComputedDistance] = useState<string>('0.00');
  const [computedClimb, setComputedClimb] = useState<string>('0');

  // Interactive Control States
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof TEMPLATE_STYLES>('dark');
  const [strokeWidth, setStrokeWidth] = useState<number>(3.0);
  const [mapPadding, setMapPadding] = useState<number>(70);
  const [lineOpacity, setLineOpacity] = useState<number>(1);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Form Label Overlays States
  const [runnerName, setRunnerName] = useState<string>('MOCK ATHLETE');
  const [raceName, setRaceName] = useState<string>('COMRADES MARATHON');
  const [raceYear, setRaceYear] = useState<string>('2026');
  const [finishTime, setFinishTime] = useState<string>('07:45:18');
  const [bibNumber, setBibNumber] = useState<string>('40512');
  const [customQuote, setCustomQuote] = useState<string>('Local is Lekker.');

  // Auto Framing Matrix Camera Loop
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      const lons = routeCoords.map(c => c[0]);
      const lats = routeCoords.map(c => c[1]);
      mapRef.current.fitBounds(
        [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
        { padding: mapPadding, duration: 1200 }
      );
    }
  }, [mapPadding, routeCoords, activeTemplate]);

  // High-Performance Browser-Native XML Ingestion Parser
  const processTrackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlText = event.target?.result as string;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const trkpts = doc.getElementsByTagName('trkpt');
        
        if (trkpts.length === 0) {
          alert("No track coordinates detected inside this file.");
          return;
        }

        const coordsArray: [number, number][] = [];
        const rawElevations: number[] = [];
        let totalDist = 0;
        let totalGain = 0;

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          coordsArray.push([lon, lat]);

          // Extract elevation data layer elements
          const eleNode = pt.getElementsByTagName('ele')[0];
          if (eleNode && eleNode.textContent) {
            rawElevations.push(parseFloat(eleNode.textContent));
          }

          // Calculate running distance accumulation via Haversine logic mapping
          if (i > 0) {
            const prevPt = trkpts[i - 1];
            const pLat = parseFloat(prevPt.getAttribute('lat') || '0');
            const pLon = parseFloat(prevPt.getAttribute('lon') || '0');
            
            const R = 6371; // Earth KM radius scale boundary
            const dLat = ((lat - pLat) * Math.PI) / 180;
            const dLon = ((lon - pLon) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((pLat * Math.PI) / 180) *
                Math.cos((lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            totalDist += R * c;

            // Compute cumulative climbing metrics threshold safely
            if (rawElevations.length > i) {
              const diff = rawElevations[i] - rawElevations[i - 1];
              if (diff > 0) totalGain += diff;
            }
          }
        }

        // Set state values inside React rendering layer
        setRouteCoords(coordsArray);
        setComputedDistance(totalDist.toFixed(2));
        setComputedClimb(Math.round(totalGain).toString());

        // Generate millimeter precise vector paths if elevations exist
        if (rawElevations.length > 0) {
          const svgWidth = 480;
          const svgHeight = 50;
          const minEle = Math.min(...rawElevations);
          const maxEle = Math.max(...rawElevations);
          const eleRange = maxEle - minEle || 1;

          // Downsample high frequency tracker node arrays to 60 control anchors
          const samplingStep = Math.max(1, Math.floor(rawElevations.length / 60));
          const sampledPoints: string[] = [];

          for (let idx = 0; idx < rawElevations.length; idx += samplingStep) {
            const x = (idx / (rawElevations.length - 1)) * svgWidth;
            const normEle = (rawElevations[idx] - minEle) / eleRange;
            const y = svgHeight - normEle * svgHeight;
            sampledPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          }

          // Seal polygon vector strings for fill overlays
          const pathString = `M 0,${svgHeight} L ${sampledPoints.join(' L ')} L ${svgWidth},${svgHeight} Z`;
          setElevationPath(pathString);
        }
      } catch (err) {
        alert("GPX XML Ingestion Error. Verify data format structure.");
      }
    };
    reader.readAsText(file);
  };

  const activeToken = TEMPLATE_STYLES[activeTemplate];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#ECEFEF', overflow: 'hidden' }}>
      
      {/* =========================================================
          CONTROL BOARD PANEL SIDEBAR (Left Column)
          ========================================================= */}
      <div style={{ 
        width: '370px', height: '100%', background: '#FFFFFF', borderRight: '1px solid #DFE3E3', 
        display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 20 
      }}>
        <div style={{ padding: '20px', background: '#10172A', color: '#FFFFFF' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>KUDOS ENGINE v1.2</h2>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Milestone Trophy Asset Factory</p>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STEP 1: INGEST */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>1. TRACK DATA FILE SOURCE</label>
            <label style={{ display: 'block', padding: '12px', background: '#C9A84C', color: 'white', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
              {routeCoords.length > 0 ? "🔄 CHANGE GPS TRACK OVERLAY" : "📂 SELECT ROUTE FILE (.GPX)"}
              <input type="file" accept=".gpx" onChange={processTrackFile} style={{ display: 'none' }} />
            </label>
          </div>

          {/* SPLIT LAYOUT: PHOTO ASSET LOADER */}
          {activeToken.layoutMode === 'split-photo' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>UPLOAD PERSONAL GRAPHIC LAYER</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhotoPreview(URL.createObjectURL(f));
              }} style={{ fontSize: '12px', width: '100%' }} />
            </div>
          )}

          {/* STEP 2: LOCKED GUIDELINES TEMPLATES SWITCHER */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>2. ART STYLE DIRECTION</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.values(TEMPLATE_STYLES).map((token) => (
                <button key={token.id} onClick={() => setActiveTemplate(token.id as any)} style={{
                  padding: '9px 12px', borderRadius: '6px', border: activeTemplate === token.id ? '2px solid #C9A84C' : '1px solid #E2E8F0', background: activeTemplate === token.id ? '#FDFBF7' : '#FFFFFF', textAlign: 'left', fontWeight: activeTemplate === token.id ? 700 : 500, fontSize: '12px', cursor: 'pointer'
                }}>
                  {token.name}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: DESIGN DIALS */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>3. GEOMETRY CONFIGURATION SLIDERS</label>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}><span>Stroke Weight</span><span>{strokeWidth}px</span></div>
              <input type="range" min="1.0" max="6.0" step="0.2" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}><span>Frame Offset Margins</span><span>{mapPadding}px</span></div>
              <input type="range" min="40" max="130" step="5" value={mapPadding} onChange={(e) => setMapPadding(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
          </div>

          {/* STEP 4: LABELS TEXT INPUT OVERRIDES */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>4. TYPOGRAPHY TEXT LABELS MANAGEMENT</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Athlete Identifier" value={runnerName} onChange={(e) => setRunnerName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Event Branded Name" value={raceName} onChange={(e) => setRaceName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Year" value={raceYear} onChange={(e) => setRaceYear(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Bib" value={bibNumber} onChange={(e) => setBibNumber(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <input type="text" placeholder="Official Logged Timing" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Custom Poster Subtitle" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================
          THE CANVAS ARTBOARD WORKBENCH (Right Panel)
          ========================================================= */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
        <div id="print-art-board" style={{
          width: '100%', maxWidth: '530px', height: '100%', maxHeight: '760px',
          background: activeToken.bg, border: `1px solid ${activeToken.borderColor}`,
          borderRadius: '12px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', relative: 'position', boxSizing: 'border-box',
          transition: 'all 0.3s ease'
        }}>
          
          {/* CONFIG: MEDAL MOCK HOLE PLACEHOLDER */}
          {activeToken.layoutMode === 'medal' && (
            <div style={{
              position: 'absolute', top: '40px', left: '40px', width: '85px', height: '85px',
              borderRadius: '50%', border: `2px dashed ${activeToken.lineColor}`,
              background: 'rgba(201,168,76,0.04)', display: 'flex', justifyContent: 'center',
              alignItems: 'center', color: activeToken.lineColor, fontSize: '9px', fontWeight: 'bold', zIndex: 10
            }}>
              MEDAL MOUNT
            </div>
          )}

          {/* MAIN CONTAINER CONTENT MATRIX RENDERER */}
          <div style={{ 
            flex: 1, width: '100%', display: 'flex', 
            flexDirection: activeToken.layoutMode === 'split-photo' ? 'row' : 'column',
            gap: '16px', overflow: 'hidden' 
          }}>
            
            {/* CONDITIONAL COMPONENT: IMAGE PANEL */}
            {activeToken.layoutMode === 'split-photo' && (
              <div style={{ 
                flex: 1, background: '#222', borderRadius: '8px', 
                overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' 
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Runner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '10px' }}>[PHOTO PLACEHOLDER CONTAINER]</div>
                )}
              </div>
            )}

            {/* VECTOR MAP ENGINE CONTAINER */}
            <div style={{ flex: 1.3, borderRadius: '8px', overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
              <Map 
                ref={mapRef} 
                mapLib={maplibregl} 
                mapStyle={activeToken.mapStyle} 
                style={{ width: '100%', height: '100%' }} 
                attributionControl={false}
              >
                <NavigationControl position="top-right" />
                {routeCoords.length > 0 && (
                  <Source id="track-vector" type="geojson" data={{
                    type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoords }
                  }}>
                    <Layer id="track-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{
                      'line-color': activeToken.lineColor, 'line-width': strokeWidth, 'line-opacity': lineOpacity
                    }} />
                  </Source>
                )}
              </Map>
            </div>
          </div>

          {/* LAYER 2: THE REAL DYNAMIC ELEVATION PROFILE CURVE */}
          {activeToken.hasElevation && elevationPath && (
            <div style={{ height: '70px', width: '100%', marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: activeToken.lineColor, opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <span>Course Terrain Altitude Chart</span>
                <span>{computedClimb}m Gain</span>
              </div>
              <svg style={{ width: '100%', height: '50px', overflow: 'visible' }} viewBox="0 0 480 50" preserveAspectRatio="none">
                <path d={elevationPath} fill={activeToken.elevationFill} stroke={activeToken.lineColor} strokeWidth="1.2" strokeLinejoin="round" />
                <line x1="0" y1="50" x2="480" y2="50" stroke={activeToken.lineColor} strokeWidth="1" opacity="0.15" />
              </svg>
            </div>
          )}

          {/* LAYER 3: LABELS OVERLAY FRAME BASELINE */}
          <div style={{ 
            marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${activeToken.borderColor}`, 
            color: activeToken.textColor, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '3px' 
          }}>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {raceName || "COURSE GRAPHIC OUTLINE"}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.7, marginBottom: '4px' }}>
              {customQuote}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <div>DISTANCE: <span style={{ fontWeight: 400 }}>{computedDistance} KM</span></div>
              <div>ATHLETE: <span style={{ fontWeight: 400 }}>{runnerName}</span></div>
              <div>YEAR: <span style={{ fontWeight: 400 }}>{raceYear}</span></div>
              <div>BIB: <span style={{ fontWeight: 400 }}>{bibNumber}</span></div>
              <div>TIME: <span style={{ fontWeight: 400 }}>{finishTime}</span></div>
            </div>
          </div>

          {/* FLOATING ACTION PRINT CONTROLLER */}
          {routeCoords.length > 0 && (
            <button onClick={() => window.print()} style={{
              position: 'absolute', bottom: '130px', right: '40px', padding: '8px 16px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }}>
              🖨️ EXPORT IMAGE LAYER
            </button>
          )}

        </div>
      </div>

    </div>
  );
}