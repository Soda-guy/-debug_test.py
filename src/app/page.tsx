"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/components/layout/demo-banner";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <div className="app-shell relative flex min-h-[calc(100dvh-2rem)] flex-col overflow-hidden">
        {/* Atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 100% 70% at 50% 0%, #fecdd3 0%, #ffedd5 40%, #ffffff 75%)",
          }}
        />
        <div className="dark:hidden" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
          style={{
            background:
              "radial-gradient(ellipse 100% 70% at 50% 0%, #4c0519 0%, #1c1917 45%, #09090b 80%)",
          }}
        />

        <header className="flex items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 text-sm font-black text-white shadow-lg shadow-rose-500/40">
              BB
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">BillBless</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </header>

        <section className="flex flex-1 flex-col justify-center px-5 pb-10 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-display text-5xl font-black leading-[0.95] tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
              Bill
              <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Bless
              </span>
            </p>
            <motion.h1
              className="mt-4 max-w-sm text-2xl font-bold leading-snug text-zinc-800 dark:text-zinc-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Swipe Right. Change a Life.
            </motion.h1>
            <motion.p
              className="mt-3 max-w-sm text-base text-zinc-600 dark:text-zinc-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
            >
              Browse anonymous, verified bill statements. Help strangers pay what they owe — with a
              transparent $1 platform fee.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-col gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button size="lg" className="w-full gap-2 text-base" asChild>
              <Link href="/discover">
                Open Discover <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/auth/register">Create free account</Link>
            </Button>
          </motion.div>

          <motion.ul
            className="mt-10 space-y-3"
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
            }}
          >
            {[
              { icon: Heart, text: "Swipe like Tinder — left skip, right help, up pay remaining" },
              { icon: Shield, text: "PII redacted. Originals private. Human verification required" },
              { icon: Sparkles, text: "Demo mode: simulated payments, no real money movement" },
            ].map(({ icon: Icon, text }) => (
              <motion.li
                key={text}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0 },
                }}
                className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/15 to-orange-500/15 text-rose-500">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </motion.li>
            ))}
          </motion.ul>
        </section>
      </div>
    </div>
  );
}
