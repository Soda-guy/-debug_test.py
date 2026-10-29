"use client";

import { motion } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import type { BillPublic } from "@/types";
import { fundingPercent, formatMoney, remainingBalance } from "@/lib/money/format";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/demo/seed-bills";
import { cn } from "@/lib/utils/cn";

function RedactedLine({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span
        className={cn(
          "inline-block h-3.5 rounded-sm bg-zinc-900 dark:bg-zinc-100",
          wide ? "w-36 max-w-[55%]" : "w-28 max-w-[45%]"
        )}
        aria-label="Redacted"
      />
    </div>
  );
}

interface BillStatementCardProps {
  bill: BillPublic;
  className?: string;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function BillStatementCard({ bill, className, compact, style }: BillStatementCardProps) {
  const { statement } = bill;
  const pct = fundingPercent(bill.amountDueMinor, bill.amountFundedMinor);
  const remaining = remainingBalance(bill.amountDueMinor, bill.amountFundedMinor);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950",
        className
      )}
      style={style}
    >
      {/* Statement header — biller branded */}
      <div
        className="relative px-5 pb-4 pt-5 text-white"
        style={{ background: statement.theme.headerBg }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 90% 10%, rgba(255,255,255,0.4), transparent 50%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div
              className="mb-1 inline-flex h-9 items-center rounded-lg bg-white/15 px-2.5 text-xs font-black tracking-wider backdrop-blur-sm"
              style={{ color: "#fff" }}
            >
              {statement.theme.logoText}
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-wide">
              {statement.billerName}
            </h2>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80">
              {statement.statementTitle}
            </p>
          </div>
          <Badge variant="verified" className="shrink-0 gap-1 bg-white/20 text-white backdrop-blur">
            <BadgeCheck className="h-3 w-3" />
            Verified
          </Badge>
        </div>
      </div>

      {/* Statement body — looks like a paper bill */}
      <div
        className={cn(
          "flex flex-1 flex-col bg-[linear-gradient(180deg,#fff_0%,#fafafa_100%)] px-5 py-4 dark:bg-[linear-gradient(180deg,#09090b_0%,#18181b_100%)]",
          compact ? "gap-2" : "gap-3"
        )}
      >
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
          <RedactedLine label="Customer Name" wide />
          <RedactedLine label="Service Address" wide />
          <RedactedLine label="Account Number" />
        </div>

        {statement.billingPeriodLabel && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Billing Period</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {statement.billingPeriodLabel}
            </span>
          </div>
        )}

        {(statement.previousBalanceLabel || statement.currentChargesLabel) && (
          <div className="space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            {statement.previousBalanceLabel && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Previous Balance</span>
                <span>{statement.previousBalanceLabel}</span>
              </div>
            )}
            {statement.currentChargesLabel && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Current Charges</span>
                <span>{statement.currentChargesLabel}</span>
              </div>
            )}
          </div>
        )}

        {statement.lineItems && statement.lineItems.length > 0 && !compact && (
          <div className="space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            {statement.lineItems.map((item) => (
              <div key={item.label} className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>{item.label}</span>
                <span>{item.amountLabel}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className="mt-auto rounded-2xl p-4 text-center"
          style={{
            background: `linear-gradient(135deg, ${statement.theme.primaryColor}12, ${statement.theme.accentColor}18)`,
            border: `1px solid ${statement.theme.primaryColor}22`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Total Amount Due
          </p>
          <p
            className="mt-1 text-3xl font-black tracking-tight"
            style={{ color: statement.theme.primaryColor }}
          >
            {statement.amountDueLabel}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Payment Due: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{statement.dueDateLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5" />
          {statement.locationLabel}
          <span className="mx-1">·</span>
          {CATEGORY_LABELS[bill.category]}
        </div>

        {/* Funding progress */}
        <div className="space-y-2 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Funding Progress</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{pct}%</span>
          </div>
          <Progress value={pct} />
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>
              {formatMoney(bill.amountFundedMinor, bill.currencyCode)} /{" "}
              {formatMoney(bill.amountDueMinor, bill.currencyCode)}
            </span>
            <span>
              {bill.contributorCount} donor{bill.contributorCount === 1 ? "" : "s"} ·{" "}
              {formatMoney(remaining, bill.currencyCode)} left
            </span>
          </div>
        </div>

        {statement.footerNote && (
          <p className="text-center text-[10px] text-zinc-400">{statement.footerNote}</p>
        )}
      </div>
    </div>
  );
}

/** Overlay stamp shown while dragging */
export function SwipeStamp({
  type,
}: {
  type: "skip" | "contribute" | "pay_all" | null;
}) {
  if (!type) return null;
  const config = {
    skip: { label: "SKIP", color: "border-rose-500 text-rose-500 rotate-[-12deg]" },
    contribute: { label: "HELP", color: "border-emerald-500 text-emerald-500 rotate-[12deg]" },
    pay_all: { label: "PAY ALL", color: "border-sky-500 text-sky-500 rotate-[-6deg]" },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "pointer-events-none absolute left-1/2 top-28 z-20 -translate-x-1/2 rounded-xl border-4 px-4 py-2 text-2xl font-black tracking-widest",
        config.color
      )}
    >
      {config.label}
    </motion.div>
  );
}
