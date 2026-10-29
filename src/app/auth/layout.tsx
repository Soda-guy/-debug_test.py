import { DemoBanner } from "@/components/layout/demo-banner";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex min-h-dvh flex-col bg-white/80 dark:bg-zinc-950/80">
      <DemoBanner />
      <div className="flex items-center justify-center px-4 py-6">
        <Link href="/discover" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 text-sm font-black text-white shadow-lg shadow-rose-500/30">
            BB
          </span>
          <div>
            <p className="font-display text-xl font-extrabold">BillBless</p>
            <p className="text-[10px] text-zinc-400">Swipe Right. Change a Life.</p>
          </div>
        </Link>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-8">{children}</div>
    </div>
  );
}
