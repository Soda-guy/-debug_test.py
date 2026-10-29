"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, HeartHandshake, PlusCircle, Search, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/post", label: "Post Bill", icon: PlusCircle },
  { href: "/impact", label: "My Impact", icon: HeartHandshake },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom pointer-events-none fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95">
      <ul className="pointer-events-auto mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isPost = href === "/post";
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                  active ? "text-rose-500" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {isPost ? (
                  <span
                    className={cn(
                      "flex h-10 w-10 -mt-3 items-center justify-center rounded-full shadow-lg transition-transform",
                      active
                        ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white scale-110"
                        : "bg-gradient-to-br from-rose-400 to-orange-400 text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                ) : (
                  <Icon className={cn("h-5 w-5", active && "fill-rose-500/20")} strokeWidth={active ? 2.5 : 2} />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
