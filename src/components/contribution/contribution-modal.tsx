"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Loader2, PartyPopper, Shield } from "lucide-react";
import type { BillPublic } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateFees } from "@/lib/payments/fee-calculator";
import { formatMoney, majorToMinor, remainingBalance } from "@/lib/money/format";
import { contributeToBill } from "@/lib/demo/store";
import { useDemoUser } from "@/hooks/use-demo-store";
import { cn } from "@/lib/utils/cn";

const PRESETS = [5, 10, 25, 50, 100];

interface ContributionModalProps {
  bill: BillPublic | null;
  mode: "partial" | "remaining";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onRequireAuth?: () => void;
}

export function ContributionModal({
  bill,
  mode,
  open,
  onOpenChange,
  onSuccess,
  onRequireAuth,
}: ContributionModalProps) {
  const user = useDemoUser();
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | "custom" | "remaining" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [phase, setPhase] = useState<"pick" | "confirm" | "processing" | "success" | "celebrate">(
    "pick"
  );
  const [error, setError] = useState<string | null>(null);
  const [fullyFunded, setFullyFunded] = useState(false);

  useEffect(() => {
    if (!open || !bill) return;
    setError(null);
    setConfirming(false);
    setCustom("");
    setPhase("pick");
    setFullyFunded(false);
    if (mode === "remaining") {
      setSelected("remaining");
      setPhase("confirm");
    } else {
      setSelected(25);
    }
  }, [open, bill, mode]);

  const remaining = bill
    ? remainingBalance(bill.amountDueMinor, bill.amountFundedMinor)
    : 0;

  const amountMinor = useMemo(() => {
    if (!bill) return 0;
    if (selected === "remaining") return remaining;
    if (selected === "custom") {
      const n = Number(custom);
      if (!Number.isFinite(n) || n <= 0) return 0;
      return Math.min(majorToMinor(n, bill.currencyCode), remaining);
    }
    if (typeof selected === "number") {
      return Math.min(majorToMinor(selected, bill.currencyCode), remaining);
    }
    return 0;
  }, [bill, selected, custom, remaining]);

  const fees = useMemo(() => {
    if (!bill || amountMinor <= 0) return null;
    return calculateFees(amountMinor, bill.currencyCode);
  }, [bill, amountMinor]);

  async function handleConfirm() {
    if (!bill || !fees || amountMinor <= 0) return;
    if (!user) {
      onRequireAuth?.();
      return;
    }
    setPhase("processing");
    setError(null);
    const idempotencyKey = crypto.randomUUID();
    const result = await contributeToBill({
      billId: bill.id,
      amountMinor,
      idempotencyKey,
    });
    if (!result.ok) {
      setError(result.error);
      setPhase("confirm");
      return;
    }
    setFullyFunded(result.fullyFunded);
    setPhase(result.fullyFunded ? "celebrate" : "success");
    onSuccess?.();
  }

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 px-6 pb-6 pt-8 text-white">
          <DialogHeader>
            <Badge variant="demo" className="mb-2 w-fit bg-white/20">
              DEMO MODE — No real charges
            </Badge>
            <DialogTitle className="text-2xl text-white">
              {mode === "remaining" ? "Pay remaining balance" : "Help pay this bill"}
            </DialogTitle>
            <DialogDescription className="text-white/85">
              {bill.statement.billerName} · {bill.statement.locationLabel}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <AnimatePresence mode="wait">
            {(phase === "pick" || phase === "confirm") && (
              <motion.div
                key="pick"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => {
                    const minor = majorToMinor(p, bill.currencyCode);
                    const disabled = minor > remaining;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelected(p);
                          setPhase("confirm");
                        }}
                        className={cn(
                          "rounded-2xl border-2 py-3 text-base font-bold transition-all",
                          selected === p
                            ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950"
                            : "border-zinc-200 hover:border-rose-300 dark:border-zinc-700",
                          disabled && "opacity-40"
                        )}
                      >
                        {formatMoney(minor, bill.currencyCode)}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSelected("custom");
                      setPhase("confirm");
                    }}
                    className={cn(
                      "rounded-2xl border-2 py-3 text-sm font-bold transition-all",
                      selected === "custom"
                        ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950"
                        : "border-zinc-200 hover:border-rose-300 dark:border-zinc-700"
                    )}
                  >
                    Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected("remaining");
                      setPhase("confirm");
                    }}
                    className={cn(
                      "col-span-2 rounded-2xl border-2 py-3 text-sm font-bold transition-all",
                      selected === "remaining"
                        ? "border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-950"
                        : "border-zinc-200 hover:border-sky-300 dark:border-zinc-700"
                    )}
                  >
                    Pay remaining ({formatMoney(remaining, bill.currencyCode)})
                  </button>
                </div>

                {selected === "custom" && (
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Enter amount"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    autoFocus
                  />
                )}

                {fees && amountMinor > 0 && (
                  <div className="space-y-2 rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                    <Row label="Bill contribution" value={formatMoney(fees.contributionMinor, bill.currencyCode)} />
                    <Row label="BillBless platform fee" value={formatMoney(fees.platformFeeMinor, bill.currencyCode)} />
                    {fees.processingFeeMinor > 0 && (
                      <Row
                        label="Processing fee (est.)"
                        value={formatMoney(fees.processingFeeMinor, bill.currencyCode)}
                      />
                    )}
                    {fees.taxMinor > 0 && (
                      <Row label="Tax (est.)" value={formatMoney(fees.taxMinor, bill.currencyCode)} />
                    )}
                    <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold dark:border-zinc-700">
                      <span>Total charge</span>
                      <span>{formatMoney(fees.totalChargedMinor, bill.currencyCode)}</span>
                    </div>
                    <p className="flex items-start gap-1.5 text-[11px] text-zinc-500">
                      <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                      Recipients pay $0 platform fees. Swiping never charges you — confirmation required.
                    </p>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    disabled={!fees || amountMinor <= 0 || confirming}
                    onClick={() => {
                      setConfirming(true);
                      void handleConfirm().finally(() => setConfirming(false));
                    }}
                  >
                    <Heart className="h-4 w-4" fill="currentColor" />
                    Confirm (Demo)
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-10"
              >
                <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                <p className="font-medium">Processing simulated payment…</p>
              </motion.div>
            )}

            {(phase === "success" || phase === "celebrate") && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950"
                >
                  {fullyFunded ? <PartyPopper className="h-8 w-8" /> : <Check className="h-8 w-8" />}
                </motion.div>
                <h3 className="text-xl font-bold">
                  {fullyFunded ? "Funding goal reached!" : "Thank you!"}
                </h3>
                <p className="text-sm text-zinc-500">
                  {fullyFunded
                    ? "This bill is FULLY_FUNDED. It is not marked PAID until the biller confirms payment."
                    : "Your simulated contribution was recorded. No real funds moved."}
                </p>
                {fullyFunded && (
                  <motion.div
                    className="flex gap-1"
                    initial="hidden"
                    animate="show"
                    variants={{
                      show: { transition: { staggerChildren: 0.05 } },
                    }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.span
                        key={i}
                        variants={{
                          hidden: { y: 0, opacity: 0 },
                          show: { y: [-20, 0], opacity: [0, 1, 0] },
                        }}
                        className="text-2xl"
                      >
                        ❤️
                      </motion.span>
                    ))}
                  </motion.div>
                )}
                <Button className="mt-2 w-full" onClick={() => onOpenChange(false)}>
                  Continue swiping
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
      <span>{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
