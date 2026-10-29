import { BottomNav } from "@/components/layout/bottom-nav";
import { DemoBanner } from "@/components/layout/demo-banner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex min-h-dvh flex-col bg-white/70 dark:bg-zinc-950/70">
      <DemoBanner />
      <main className="flex flex-1 flex-col overflow-hidden pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
