import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 5 Locked Master Guidelines Token Profiles
const TEMPLATE_STYLES = {
  white: {
    id: 'white', name: 'Minimal White Layout', layoutMode: 'standard',
    mapStyle: 'https://tiles.openfreemap.org/styles/positron',
    bg: '#FAFAF8', lineColor: '#1A1A1A', textColor: '#1A1A1A', borderColor: '#EAEAEA', elevationFill: 'rgba(26, 26, 26, 0.06)', hasElevation: true
  },
  dark: {
    id: 'dark', name: 'Dark Luxe Premium', layoutMode: 'standard',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#0A0A0A', lineColor: '#C9A84C', textColor: '#FFFFFF', borderColor: '#222222', elevationFill: 'rgba(201, 168, 76, 0.16)', hasElevation: true
  },
  topo: {
    id: 'topo', name: 'Topo Contour Corridor', layoutMode: 'standard',
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    bg: '#F4EFEB', lineColor: '#1E3A8A', textColor: '#1E3A8A', borderColor: '#DBD2C9', elevationFill: 'rgba(30, 58, 138, 0.10)', hasElevation: true
  },
  medal: {
    id: 'medal', name: 'Physical Medal Mount (Die-Cut)', layoutMode: 'medal',
    mapStyle: 'https://tiles.openfreemap.org/styles/positron',
    bg: '#FFFFFF', lineColor: '#C9A84C', textColor: '#111111', borderColor: '#E2E8F0', elevationFill: 'transparent', hasElevation: false
  },
  photo: {
    id: 'photo', name: 'Photo + Map Side-by-Side', layoutMode: 'split-photo',
    mapStyle: 'https://tiles.openfreemap.org/styles/dark-matter',
    bg: '#141414', lineColor: '#FFFFFF', textColor: '#FFFFFF', borderColor: '#262626', elevationFill: 'transparent', hasElevation: false
  }
};

export default function AppShell() {
  const mapRef = useRef<any>(null);
  
  // Data States
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeBbox, setRouteBbox] = useState<[number, number, number, number] | null>(null);
  const [elevationPath, setElevationPath] = useState<string>('');
  const [computedDistance, setComputedDistance] = useState<string>('0.00');
  const [computedClimb, setComputedClimb] = useState<string>('0');

  // Control panel states
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof TEMPLATE_STYLES>('dark');
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [mapPadding, setMapPadding] = useState<number>(65);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Labels
  const [runnerName, setRunnerName] = useState<string>('ATHLETE NAME');
  const [raceName, setRaceName] = useState<string>('COMRADES MARATHON');
  const [raceYear, setRaceYear] = useState<string>('2026');
  const [finishTime, setFinishTime] = useState<string>('07:45:18');
  const [bibNumber, setBibNumber] = useState<string>('31422');
  const [customQuote, setCustomQuote] = useState<string>('Local is Lekker.');

  // The Failsafe Camera Controller
  const fitMapToRoute = () => {
    if (routeBbox && mapRef.current) {
      mapRef.current.fitBounds(routeBbox, { padding: mapPadding, duration: 1200 });
    }
  };

  // Re-run camera logic if padding changes
  useEffect(() => { fitMapToRoute(); }, [mapPadding, routeBbox]);

  // Native XML Parser
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
            alert("No GPS track points found in this file.");
            return;
        }

        const coordsArray: [number, number][] = [];
        const rawElevations: number[] = [];
        let totalDist = 0, totalGain = 0;
        let minL = 180, maxL = -180, minLat = 90, maxLat = -90;

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          
          coordsArray.push([lon, lat]);
          
          // Expand Bounding Box
          if (lon < minL) minL = lon;
          if (lon > maxL) maxL = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;

          const eleNode = pt.getElementsByTagName('ele')[0];
          if (eleNode && eleNode.textContent) rawElevations.push(parseFloat(eleNode.textContent));

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
        setRouteBbox([minL, minLat, maxL, maxLat]);
        setComputedDistance(totalDist.toFixed(2));
        setComputedClimb(Math.round(totalGain).toString());

        if (rawElevations.length > 0) {
          const svgWidth = 440;
          const svgHeight = 45;
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
        alert("File parsing error.");
      }
    };
    reader.readAsText(file);
  };

  const activeToken = TEMPLATE_STYLES[activeTemplate];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#ECEFEF', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR PANEL */}
      <div style={{ width: '370px', height: '100%', background: '#FFFFFF', borderRight: '1px solid #DFE3E3', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 20 }}>
        <div style={{ padding: '20px', background: '#0F172A', color: '#FFFFFF' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>KUDOS STUDIO v1.6</h2>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Asset Factory Architecture</p>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* UPLOAD */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>1. INGEST DATA ROUTE SOURCE</label>
            <label style={{ display: 'block', padding: '11px', background: '#C9A84C', color: 'white', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
              {routeCoords.length > 0 ? "🔄 RELOAD GPS TRACK" : "📂 UPLOAD ROUTE DATA (.GPX)"}
              <input type="file" accept=".gpx" onChange={processTrackFile} style={{ display: 'none' }} />
            </label>
          </div>

          {/* PHOTO LAYER */}
          {activeToken.layoutMode === 'split-photo' && (
            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#0F172A', marginBottom: '6px' }}>🖼️ UPLOAD ATHLETE PROFILE IMAGE</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhotoPreview(URL.createObjectURL(f));
              }} style={{ fontSize: '12px', width: '100%' }} />
            </div>
          )}

          {/* TEMPLATE TOGGLES */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>2. CHOOSE DESIGN TEMPLATE VARIATION</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {Object.values(TEMPLATE_STYLES).map((token) => (
                <button key={token.id} onClick={() => setActiveTemplate(token.id as any)} style={{
                  padding: '10px 12px', borderRadius: '6px', border: activeTemplate === token.id ? '2px solid #C9A84C' : '1px solid #CBD5E1', 
                  background: activeTemplate === token.id ? '#FFFBEB' : '#FFFFFF', textAlign: 'left', fontWeight: activeTemplate === token.id ? 700 : 500, fontSize: '12px', cursor: 'pointer'
                }}>
                  {token.name}
                </button>
              ))}
            </div>
          </div>

          {/* SLIDERS */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>3. GEOMETRIC TUNERS</label>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}><span>Stroke Weight thickness</span><span>{strokeWidth}px</span></div>
              <input type="range" min="1.0" max="7.0" step="0.2" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}><span>Crop Buffer Margins</span><span>{mapPadding}px</span></div>
              <input type="range" min="40" max="140" step="5" value={mapPadding} onChange={(e) => setMapPadding(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C9A84C' }} />
            </div>
          </div>

          {/* TEXT LABELS */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>4. TYPOGRAPHY TEXT INSCRIPTIONS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Athlete Identifier" value={runnerName} onChange={(e) => setRunnerName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Branded Race Name" value={raceName} onChange={(e) => setRaceName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Race Year" value={raceYear} onChange={(e) => setRaceYear(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Runner Bib" value={bibNumber} onChange={(e) => setBibNumber(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <input type="text" placeholder="Official Log Time" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Custom Poster Subtitle" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================
          RIGHT COLUMN: THE POSTER MATTE BOARD
          ========================================================= */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
        
        <div id="print-art-board" style={{
          width: '100%', maxWidth: '540px', height: '100%', maxHeight: '760px',
          background: activeToken.bg, border: `1px solid ${activeToken.borderColor}`,
          borderRadius: '16px', padding: '24px', boxShadow: '0 25px 65px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box',
          transition: 'all 0.3s ease'
        }}>
          
          {/* MEDAL CUTOUT FRAME */}
          {activeToken.layoutMode === 'medal' && (
            <div style={{
              position: 'absolute', top: '35px', left: '50%', transform: 'translateX(-50%)',
              width: '105px', height: '105px', borderRadius: '50%', border: `2px dashed ${activeToken.lineColor}`,
              background: 'rgba(201,168,76,0.04)', display: 'flex', justifyContent: 'center',
              alignItems: 'center', color: activeToken.lineColor, fontSize: '9px', fontWeight: 800, zIndex: 40
            }}>MEDAL DIE-CUT FRAME</div>
          )}

          {/* DYNAMIC FLEX GRID: Handles normal stack OR side-by-side split */}
          <div style={{ 
            flex: 1, width: '100%', display: 'flex', 
            flexDirection: activeToken.layoutMode === 'split-photo' ? 'row' : 'column',
            gap: '16px', overflow: 'hidden', position: 'relative',
            marginTop: activeToken.layoutMode === 'medal' ? '120px' : '0px',
            boxSizing: 'border-box'
          }}>
            
            {/* SPLIT SCREEN PHOTO COLUMN */}
            {activeToken.layoutMode === 'split-photo' && (
              <div style={{ flex: 1, height: '100%', background: '#1A1A1A', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Athlete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#444', fontSize: '11px', fontWeight: 700, textAlign: 'center', padding: '12px' }}>[IMAGE ROW BOX]</div>
                )}
              </div>
            )}

            {/* MAPLIBRE VECTOR CANVAS */}
            <div style={{ flex: 1.4, height: '100%', borderRadius: '10px', overflow: 'hidden', position: 'relative', minHeight: '280px' }}>
              
              {/* FAILSAFE UI DEBUG BUTTON */}
              {routeCoords.length > 0 && (
                <button onClick={fitMapToRoute} style={{
                  position: 'absolute', top: '10px', left: '10px', zIndex: 99, background: '#111', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', opacity: 0.8
                }}>🎯 Recenter Map</button>
              )}

              <Map 
                ref={mapRef} 
                mapLib={maplibregl} 
                mapStyle={activeToken.mapStyle} 
                style={{ width: '100%', height: '100%' }} 
                attributionControl={false}
                onLoad={fitMapToRoute} // VITAL: Only attempts zoom when engine is totally ready
              >
                <NavigationControl position="top-right" />
                {routeCoords.length > 0 && (
                  <Source id="track-vector" type="geojson" data={{
                    type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoords }
                  }}>
                    <Layer id="track-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{
                      'line-color': activeToken.lineColor, 'line-width': strokeWidth
                    }} />
                  </Source>
                )}
              </Map>
            </div>
          </div>

          {/* ELEVATION PROFILE */}
          {activeToken.hasElevation && elevationPath && (
            <div style={{ height: '70px', width: '100%', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: activeToken.lineColor, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <span>Altitude Gradient Contour Structure</span>
                <span>{computedClimb}m Climbing Gain</span>
              </div>
              <svg style={{ width: '100%', height: '45px', overflow: 'visible' }} viewBox="0 0 440 45" preserveAspectRatio="none">
                <path d={elevationPath} fill={activeToken.elevationFill} stroke={activeToken.lineColor} strokeWidth="1.3" strokeLinejoin="round" />
                <line x1="0" y1="45" x2="440" y2="45" stroke={activeToken.lineColor} strokeWidth="1" opacity="0.15" />
              </svg>
            </div>
          )}

          {/* TYPOGRAPHY FOOTER */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${activeToken.borderColor}`, color: activeToken.textColor, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>{raceName}</div>
            <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.7, marginBottom: '4px' }}>{customQuote}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <div>DISTANCE: <span style={{ fontWeight: 400 }}>{computedDistance} KM</span></div>
              <div>ATHLETE: <span style={{ fontWeight: 400 }}>{runnerName}</span></div>
              <div>YEAR: <span style={{ fontWeight: 400 }}>{raceYear}</span></div>
              <div>BIB: <span style={{ fontWeight: 400 }}>{bibNumber}</span></div>
              <div>TIME: <span style={{ fontWeight: 400 }}>{finishTime}</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}