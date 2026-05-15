import { AppProviders } from "@/core/AppProviders";
import AppShell from "@/shared/ui/AppShell";
import { parseGPX } from './utils/gpxParser'; // We will create this next

export default function App() {
  return (
    <AppProviders>
      {/* The AppShell is the 'House'. 
          Inside it lives the Sidebar and the Map.
      */}
      <AppShell />
      
      {/* KUDOS OVERLAY: 
          This is a temporary floating 'Lab' button so you can test 
          your GPX files immediately while we work on the Sidebar.
      */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        border: '2px solid #C9A84C' // Kudos Gold
      }}>
        <strong style={{ display: 'block', marginBottom: '5px' }}>Kudos Studio Lab</strong>
        <input 
          type="file" 
          accept=".gpx" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const coords = await parseGPX(file);
                alert(`Success! Loaded ${coords.length} points.`);
                console.log("GPX Coordinates for MapLibre:", coords);
              } catch (err) {
                alert("Error parsing GPX file.");
              }
            }
          }} 
        />
      </div>
    </AppProviders>
  );
}