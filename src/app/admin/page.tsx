"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  Shield,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DemoBanner } from "@/components/layout/demo-banner";
import { BillStatementCard } from "@/components/bills/bill-statement-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDemoUser, useDemoStore } from "@/hooks/use-demo-store";
import {
  getPendingBills,
  getPlatformStats,
  reviewBill,
} from "@/lib/demo/store";
import { formatMoney } from "@/lib/money/format";

export default function AdminPage() {
  const user = useDemoUser();
  const store = useDemoStore();
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pending = getPendingBills();
  const stats = getPlatformStats();
  const selected = useMemo(
    () => store.bills.find((b) => b.id === selectedId) ?? pending[0],
    [store.bills, selectedId, pending]
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="app-shell flex min-h-dvh flex-col">
        <DemoBanner />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Shield className="h-12 w-12 text-rose-500" />
          <h1 className="font-display text-2xl font-bold">Admin only</h1>
          <p className="max-w-sm text-sm text-zinc-500">
            Server-side role checks and RLS protect this route in production. Sign in with an
            admin demo account (email containing &quot;admin&quot;).
          </p>
          <Button asChild>
            <Link href="/auth/login?next=/admin">Sign in as admin</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-white/80 dark:bg-zinc-950/80">
      <DemoBanner />
      <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <Button variant="ghost" size="iconSm" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-lg font-bold">Admin verification</h1>
          <p className="text-[10px] text-zinc-400">Role: {user.role} · Demo authorization</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-10">
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Pending review" value={String(stats.pendingReview)} />
          <MiniStat label="Verified bills" value={String(stats.verifiedBills)} />
          <MiniStat label="Contributions" value={String(stats.totalContributions)} />
          <MiniStat
            label="Platform revenue"
            value={formatMoney(stats.platformRevenueMinor, "USD")}
          />
        </div>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <FileWarning className="h-4 w-4" /> Review queue
          </h2>
          {pending.length === 0 && (
            <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">
              No bills awaiting review. Submit one from Post Bill.
            </p>
          )}
          <div className="space-y-2">
            {pending.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
                className={`w-full rounded-2xl border p-3 text-left ${
                  selected?.id === b.id
                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{b.statement.billerName}</p>
                  <Badge variant="warning">{b.status}</Badge>
                </div>
                <p className="text-xs text-zinc-500">
                  {formatMoney(b.amountDueMinor, b.currencyCode)} · {b.countryCode}
                </p>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="space-y-3">
            <h2 className="font-semibold">Sanitized preview</h2>
            <p className="text-xs text-zinc-500">
              Original unredacted documents require explicit authorization and are never shown to
              donors. Demo shows only the sanitized card.
            </p>
            <div className="h-[380px]">
              <BillStatementCard bill={selected} className="h-full" compact />
            </div>
            <Textarea
              placeholder="Reviewer notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="success"
                className="flex-1 gap-1"
                onClick={() => {
                  reviewBill(selected.id, "approve", notes);
                  toast.success("Bill approved — now visible in Discover");
                  setNotes("");
                  setSelectedId(null);
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  reviewBill(selected.id, "needs_info", notes);
                  toast.message("Marked needs information");
                  setNotes("");
                }}
              >
                Needs info
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-1"
                onClick={() => {
                  reviewBill(selected.id, "reject", notes);
                  toast.message("Bill rejected");
                  setNotes("");
                  setSelectedId(null);
                }}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 font-semibold">Recent simulated transactions</h2>
          <div className="space-y-2">
            {store.transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{tx.provider}</span>
                  <Badge variant="demo">{tx.status}</Badge>
                </div>
                <p className="text-xs text-zinc-500">
                  {formatMoney(tx.amountMinor, tx.currencyCode)} · {tx.idempotencyKey.slice(0, 8)}…
                  {tx.isSimulated ? " · SIMULATED" : ""}
                </p>
              </div>
            ))}
            {store.transactions.length === 0 && (
              <p className="text-sm text-zinc-500">No transactions yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Audit log</h2>
          <div className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {store.auditLogs.slice(0, 30).map((log) => (
              <div key={log.id} className="rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900">
                <span className="font-mono text-rose-600">{log.action}</span> · {log.resourceType}/
                {log.resourceId.slice(0, 12)} · {new Date(log.createdAt).toLocaleString()}
              </div>
            ))}
            {store.auditLogs.length === 0 && (
              <p className="text-zinc-500">No audit events yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  );
}
