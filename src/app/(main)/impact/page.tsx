"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Landmark, Sparkles, Trophy } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDemoStore, useDemoUser } from "@/hooks/use-demo-store";
import { getImpactStats, getUserContributions, getBillById, isBillSaved } from "@/lib/demo/store";
import { formatMoney, fundingPercent } from "@/lib/money/format";

export default function ImpactPage() {
  const user = useDemoUser();
  const store = useDemoStore();
  const stats = getImpactStats();
  const contribs = getUserContributions();
  const saved = store.savedBills
    .filter((s) => s.userId === user?.id)
    .map((s) => getBillById(s.billId))
    .filter(Boolean);

  if (!user) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AppHeader title="My Impact" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Heart className="h-12 w-12 text-rose-500" />
          <h1 className="font-display text-2xl font-bold">See your impact</h1>
          <p className="text-sm text-zinc-500">Sign in to track contributions and saved bills.</p>
          <Button asChild>
            <Link href="/auth/login?next=/impact">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const months = Object.entries(stats.byMonth).sort(([a], [b]) => a.localeCompare(b));
  const maxMonth = Math.max(1, ...months.map(([, v]) => v));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader title="My Impact" />
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Your kindness, quantified</h1>
          <p className="text-sm text-zinc-500">All figures are simulated demo transactions.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Heart className="h-5 w-5" />}
            label="Contributed"
            value={formatMoney(stats.totalContributedMinor, stats.currencyCode)}
            accent="from-rose-500 to-orange-500"
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            label="Bills supported"
            value={String(stats.billsSupported)}
            accent="from-amber-500 to-orange-400"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Fully funded"
            value={String(stats.fullyFunded)}
            accent="from-emerald-500 to-teal-400"
          />
          <StatCard
            icon={<Landmark className="h-5 w-5" />}
            label="Platform fees paid"
            value={formatMoney(stats.totalFeesMinor, stats.currencyCode)}
            accent="from-sky-500 to-indigo-400"
          />
        </div>

        {months.length > 0 && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 font-semibold">Monthly contributions</h2>
            <div className="flex h-32 items-end gap-2">
              {months.map(([month, amount], i) => (
                <div key={month} className="flex flex-1 flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(amount / maxMonth) * 100}%` }}
                    transition={{ delay: i * 0.05, type: "spring" }}
                    className="w-full min-h-[4px] rounded-t-lg bg-gradient-to-t from-rose-500 to-amber-400"
                  />
                  <span className="text-[9px] text-zinc-400">{month.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Contribution history</h2>
            <Badge variant="demo">Simulated</Badge>
          </div>
          <div className="space-y-2">
            {contribs.length === 0 && (
              <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">
                No contributions yet. Head to Discover and swipe right.
              </p>
            )}
            {contribs.map((c) => {
              const bill = getBillById(c.billId);
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{bill?.statement.billerName ?? c.billId}</p>
                      <p className="text-xs text-zinc-500" suppressHydrationWarning>
                        {c.createdAt.slice(0, 10)} · {c.status}
                      </p>
                    </div>
                    <p className="font-bold text-rose-600">
                      {formatMoney(c.amountMinor, c.currencyCode)}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Charged {formatMoney(c.totalChargedMinor, c.currencyCode)} incl.{" "}
                    {formatMoney(c.platformFeeMinor, c.currencyCode)} platform fee
                    {c.isSimulated ? " · DEMO" : ""}
                  </p>
                  {bill && (
                    <div className="mt-2">
                      <Progress value={fundingPercent(bill.amountDueMinor, bill.amountFundedMinor)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Saved bills</h2>
          <div className="space-y-2">
            {saved.length === 0 && (
              <p className="text-sm text-zinc-500">Bookmark bills from Discover to revisit them.</p>
            )}
            {saved.map((bill) =>
              bill ? (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div>
                    <p className="font-medium">{bill.statement.billerName}</p>
                    <p className="text-xs text-zinc-500">
                      {formatMoney(bill.amountDueMinor, bill.currencyCode)} ·{" "}
                      {fundingPercent(bill.amountDueMinor, bill.amountFundedMinor)}% funded
                      {isBillSaved(bill.id) ? "" : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">{bill.status}</Badge>
                </div>
              ) : null
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        className={`mb-3 inline-flex rounded-2xl bg-gradient-to-br ${accent} p-2 text-white shadow-md`}
      >
        {icon}
      </div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-display text-xl font-bold tracking-tight">{value}</p>
    </motion.div>
  );
}
