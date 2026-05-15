import { AppProviders } from "@/core/AppProviders";
import AppShell from "@/shared/ui/AppShell";

/**
 * KUDOS ASSET FACTORY
 * This is the clean root of your app. 
 * All the 'magic' (Map, Sidebar, Uploads) now lives inside AppShell.
 */
export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}