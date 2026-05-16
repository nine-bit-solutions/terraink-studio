import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 5 Branded Style Configurations (Style Tokens Mapped Directly)
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
    bg: '#F5EFEB',
    lineColor: '#1E3A8A',
    textColor: '#1E3A8A',
    borderColor: '#DCD3CB',
    elevationFill: 'rgba(30, 58, 138, 0.10)',
    hasElevation: true,
    layoutMode: 'standard'
  },
  medal: {
    id: 'medal',
    name: 'Medal + Map (Physical Frame Mount)',
    mapStyle: 'https://tiles.openfreemap.org/styles/positron',
    bg: '#FFFFFF',
    lineColor: '#C9A84C',
    textColor: '#1A1A1A',
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
    borderColor: '#222222',
    elevationFill: 'transparent',
    hasElevation: false,
    layoutMode: 'split-photo'
  }
};

export default function AppShell() {
  const mapRef = useRef<any>(null);
  
  // File State Channels
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [elevationPath, setElevationPath] = useState<string>('');
  const [computedDistance, setComputedDistance] = useState<string>('0.00');
  const [computedClimb, setComputedClimb] = useState<string>('0');

  // Sliders & Style Configs
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof TEMPLATE_STYLES>('dark');
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [mapPadding, setMapPadding] = useState<number>(75);
  const [lineOpacity, setLineOpacity] = useState<number>(1);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Typographic Values
  const [runnerName, setRunnerName] = useState<string>('ATHLETE NAME');
  const [raceName, setRaceName] = useState<string>('COMRADES MARATHON');
  const [raceYear, setRaceYear] = useState<string>('2026');
  const [finishTime, setFinishTime] = useState<string>('07:45:18');
  const [bibNumber, setBibNumber] = useState<string>('31422');
  const [customQuote, setCustomQuote] = useState<string>('Local is Lekker.');

  // Camera reset matrix bounds effect
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      const lons = routeCoords.map(c => c[0]);
      const lats = routeCoords.map(c => c[1]);
      mapRef.current.fitBounds(
        [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
        { padding: mapPadding, duration: 1000 }
      );
    }
  }, [mapPadding, routeCoords, activeTemplate]);

  // Parser
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
        
        if (trkpts.length === 0) return;

        const coordsArray: [number, number][] = [];
        const rawElevations: number[] = [];
        let totalDist = 0;
        let totalGain = 0;

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          coordsArray.push([lon, lat]);

          const eleNode = pt.getElementsByTagName('ele')[0];
          if (eleNode && eleNode.textContent) {
            rawElevations.push(parseFloat(eleNode.textContent));
          }

          if (i > 0) {
            const prevPt = trkpts[i - 1];
            const pLat = parseFloat(prevPt.getAttribute('lat') || '0');
            const pLon = parseFloat(prevPt.getAttribute('lon') || '0');
            
            const R = 6371;
            const dLat = ((lat - pLat) * Math.PI) / 180;
            const dLon = ((lon - pLon) * Math.PI) / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((pLat*Math.PI)/180) * Math.cos((lat*Math.PI)/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            totalDist += R * c;

            if (rawElevations.length > i) {
              const diff = rawElevations[i] - rawElevations[i - 1];
              if (diff > 0) totalGain += diff;
            }
          }
        }

        setRouteCoords(coordsArray);
        setComputedDistance(totalDist.toFixed(2));
        setComputedClimb(Math.round(totalGain).toString());

        if (rawElevations.length > 0) {
          const svgWidth = 440;
          const svgHeight = 50;
          const minEle = Math.min(...rawElevations);
          const maxEle = Math.max(...rawElevations);
          const eleRange = maxEle - minEle || 1;
          const step = Math.max(1, Math.floor(rawElevations.length / 60));
          const sampled: string[] = [];

          for (let idx = 0; idx < rawElevations.length; idx += step) {
            const x = (idx / (rawElevations.length - 1)) * svgWidth;
            const norm = (rawElevations[idx] - minEle) / eleRange;
            const y = svgHeight - norm * svgHeight;
            sampled.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          }
          setElevationPath(`M 0,${svgHeight} L ${sampled.join(' L ')} L ${svgWidth},${svgHeight} Z`);
        }
      } catch (err) {
        alert("Parser error.");
      }
    };
    reader.readAsText(file);
  };

  const activeToken = TEMPLATE_STYLES[activeTemplate];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#ECEFEF', overflow: 'hidden' }}>
      
      {/* ==========================================
          CONTROL PANEL SIDEBAR CONTAINER
          ========================================== */}
      <div style={{ width: '380px', height: '100%', background: '#FFFFFF', borderRight: '1px solid #DFE3E3', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 20 }}>
        <div style={{ padding: '24px', background: '#0F172A', color: '#FFFFFF' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>KUDOS ENGINE v1.4</h2>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Milestone Studio Controller</p>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* GPX LOADER */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>1. INGEST DATA ROUTE</label>
            <label style={{ display: 'block', padding: '12px', background: '#C9A84C', color: 'white', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
              {routeCoords.length > 0 ? "🔄 RELOAD GPX DATA" : "📂 SELECT UPLOAD FILE (.GPX)"}
              <input type="file" accept=".gpx" onChange={processTrackFile} style={{ display: 'none' }} />
            </label>
          </div>

          {/* DYNAMIC IMAGE UPLOADER */}
          {activeToken.layoutMode === 'split-photo' && (
            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#0F172A', marginBottom: '6px' }}>🖼️ POSTER ATTACHED PHOTO LAYER</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhotoPreview(URL.createObjectURL(f));
              }} style={{ fontSize: '12px', width: '100%' }} />
            </div>
          )}

          {/* CHOOSE MASTER PROFILE */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>2. CHOOSE DESIGN PROFILE GUIDELINE</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {Object.values(TEMPLATE_STYLES).map((token) => (
                <button key={token.id} onClick={() => setActiveTemplate(token.id as any)} style={{
                  padding: '10px 12px', borderRadius: '6px', 
                  border: activeTemplate === token.id ? '2px solid #C9A84C' : '1px solid #CBD5E1', 
                  background: activeTemplate === token.id ? '#FFFBEB' : '#FFFFFF', 
                  textAlign: 'left', fontWeight: activeTemplate === token.id ? 700 : 500, fontSize: '12px', cursor: 'pointer'
                }}>
                  {token.name}
                </button>
              ))}
            </div>
          </div>

          {/* CONFIGURATION KNOBS */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>3. GEOMETRIC TUNERS SLIDERS</label>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '4px' }}><span>Line Weight Thickness</span><span>{strokeWidth}px</span></div>
              <input type="range" min="1.0" max="7.0" step="0.2" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '4px' }}><span>Bounds Crop Buffer Margins</span><span>{mapPadding}px</span></div>
              <input type="range" min="40" max="140" step="5" value={mapPadding} onChange={(e) => setMapPadding(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
          </div>

          {/* INSCRIPTIONS LABEL REGIONS */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>4. TYPOGRAPHY TEXT OVERLAYS MANAGEMENT</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Athlete Name" value={runnerName} onChange={(e) => setRunnerName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Race Event Title" value={raceName} onChange={(e) => setRaceName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Year" value={raceYear} onChange={(e) => setRaceYear(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Bib Number" value={bibNumber} onChange={(e) => setBibNumber(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <input type="text" placeholder="Official Timing Finish" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Motivation Quote Subtitle" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
          </div>

        </div>
      </div>

      {/* ==========================================
          THE RESPONSIVE CANVAS ARTBOARD PANEL
          ========================================== */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
        
        {/* FRAMED SHEET MOUNT WRAPPER Card surface */}
        <div id="print-art-board" style={{
          width: '100%', maxWidth: '540px', height: '100%', maxHeight: '770px',
          background: activeToken.bg, border: `1px solid ${activeToken.borderColor}`,
          borderRadius: '16px', padding: '24px', boxShadow: '0 25px 65px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box',
          transition: 'all 0.3s ease'
        }}>
          
          {/* CONDITION 1: DIE-CUT MEDAL CAVITY Zone RING */}
          {activeToken.layoutMode === 'medal' && (
            <div style={{
              position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
              width: '110px', height: '110px', borderRadius: '50%', 
              border: `2px dashed ${activeToken.lineColor}`,
              background: 'rgba(201,168,76,0.05)', display: 'flex', justifyContent: 'center',
              alignItems: 'center', color: activeToken.lineColor, fontSize: '9px', fontWeight: 800, zIndex: 40
            }}>
              MEDAL DIE-CUT FRAME
            </div>
          )}

          {/* MAIN INTERNAL ROW / COLUMN ADAPTIVE GRID HOUSING MAP */}
          <div style={{ 
            flex: 1, width: '100%', display: 'flex', 
            flexDirection: activeToken.layoutMode === 'split-photo' ? 'row' : 'column',
            gap: '16px', overflow: 'hidden', position: 'relative',
            marginTop: activeToken.layoutMode === 'medal' ? '120px' : '0px' // Offset map down to clear the medal zone safely
          }}>
            
            {/* CONDITION 2: PHOTO Split VIEW LAYER PANEL */}
            {activeToken.layoutMode === 'split-photo' && (
              <div style={{ 
                flex: 1, background: '#1A1A1A', borderRadius: '10px', border: '1px solid #2A2A2A',
                overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' 
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Athlete Canvas Element" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#444', fontSize: '11px', textAlign: 'center', padding: '16px', fontWeight: 600 }}>
                    [RUNNER CANVAS HOUSING]
                  </div>
                )}
              </div>
            )}

            {/* MAP VECTOR CANVAS CONTEXT EMBED PANEL */}
            <div style={{ flex: 1.4, borderRadius: '10px', overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
              <Map 
                key={activeTemplate} // Crucial trick: Obliterates pre-cached layer structures instantly on tile flag click
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

          {/* DYNAMIC ALTITUDE PROFILE CURVES LAYER */}
          {activeToken.hasElevation && elevationPath && (
            <div style={{ height: '70px', width: '100%', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: activeToken.lineColor, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <span>Altitude Gradient Chart Contour</span>
                <span>{computedClimb}m Climbing</span>
              </div>
              <svg style={{ width: '100%', height: '48px', overflow: 'visible' }} viewBox="0 0 480 50" preserveAspectRatio="none">
                <path d={elevationPath} fill={activeToken.elevationFill} stroke={activeToken.lineColor} strokeWidth="1.3" strokeLinejoin="round" />
                <line x1="0" y1="50" x2="480" y2="50" stroke={activeToken.lineColor} strokeWidth="1" opacity="0.15" />
              </svg>
            </div>
          )}

          {/* POSTER FOOTER LABELS COMPLIANT DESIGNS */}
          <div style={{ 
            marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${activeToken.borderColor}`, 
            color: activeToken.textColor, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' 
          }}>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {raceName || "COURSE LABELS MATRIX"}
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

          {/* FLOATING ACTION EXPORT PREVIEW LAYER */}
          {routeCoords.length > 0 && (
            <button onClick={() => window.print()} style={{
              position: 'absolute', bottom: '130px', right: '40px', padding: '8px 16px', 
              background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', zIndex: 99
            }}>
              🖨️ EXPORT ASSET LAYER
            </button>
          )}

        </div>
      </div>

    </div>
  );
}