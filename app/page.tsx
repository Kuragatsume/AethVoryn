import BackgroundVideo from "@/components/BackgroundVideo";
import { EcosystemProvider } from "@/components/ecosystem/EcosystemContext";
import EcosystemShell from "@/components/ecosystem/EcosystemShell";

export default function Home() {
  return (
    <EcosystemProvider>
      <BackgroundVideo />
      <main className="relative min-h-[var(--bg-video-height,100svh)] w-full">
        <EcosystemShell />
      </main>
    </EcosystemProvider>
  );
}
