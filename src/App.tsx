import { AppProviders } from "@/core/AppProviders";
import AppShell from "@/shared/ui/AppShell";

/**
 * KUDOS ASSET FACTORY - ENTRY POINT
 * * This is the clean root of your application. 
 * All Map and Sidebar logic now lives inside AppShell for a 
 * professional, seamless design experience.
 */
export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}