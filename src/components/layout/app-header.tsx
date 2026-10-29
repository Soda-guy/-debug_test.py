"use client";

import Link from "next/link";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserNotifications, markNotificationsRead } from "@/lib/demo/store";
import { useDemoStore } from "@/hooks/use-demo-store";

export function AppHeader({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const store = useDemoStore();
  const unread = store.user
    ? getUserNotifications().filter((n) => !n.read).length
    : 0;

  useEffect(() => setMounted(true), []);

  return (
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-zinc-100/80 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <Link href="/discover" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 text-sm font-black text-white shadow-md shadow-rose-500/30">
          BB
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
            BillBless
          </p>
          {title ? (
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{title}</p>
          ) : (
            <p className="text-[10px] font-medium text-zinc-400">Swipe Right. Change a Life.</p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <Badge variant="demo" className="mr-1 hidden xs:inline-flex sm:inline-flex">
          DEMO
        </Badge>
        <Button
          variant="ghost"
          size="iconSm"
          className="relative h-10 w-10"
          aria-label="Notifications"
          onClick={() => markNotificationsRead()}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
        {mounted && (
          <Button
            variant="ghost"
            size="iconSm"
            className="h-10 w-10"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </header>
  );
}
