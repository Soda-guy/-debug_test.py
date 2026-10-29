"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Loader2, PartyPopper, Shield, X } from "lucide-react";
import type { BillPublic } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateFees } from "@/lib/payments/fee-calculator";
import { formatMoney, majorToMinor, remainingBalance } from "@/lib/money/format";
import { contributeToBill, loginDemo } from "@/lib/demo/store";
import { useDemoUser } from "@/hooks/use-demo-store";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

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
}: ContributionModalProps) {
  const user = useDemoUser();
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | "custom" | "remaining" | null>(25);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"pick" | "processing" | "success" | "celebrate">("pick");
  const [error, setError] = useState<string | null>(null);
  const [fullyFunded, setFullyFunded] = useState(false);

  useEffect(() => {
    if (!open || !bill) return;
    setError(null);
    setBusy(false);
    setCustom("");
    setFullyFunded(false);
    setPhase("pick");
    setSelected(mode === "remaining" ? "remaining" : 25);
    // Reset only when opening a different bill/mode — avoid resetting mid-confirm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bill?.id, mode]);

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
    if (!bill || !fees || amountMinor <= 0) {
      setError("Select a valid amount to continue.");
      return;
    }
    if (!user) {
      loginDemo("demo@billbless.app", "demopass1");
      toast.message("Continuing as demo user");
    }

    setBusy(true);
    setPhase("processing");
    setError(null);

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const result = await contributeToBill({
        billId: bill.id,
        amountMinor,
        idempotencyKey,
      });

      if (!result.ok) {
        setError(result.error);
        setPhase("pick");
        setBusy(false);
        return;
      }

      setFullyFunded(result.fullyFunded);
      setPhase(result.fullyFunded ? "celebrate" : "success");
      toast.success("Contribution recorded (demo)");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Contribution failed");
      setPhase("pick");
    } finally {
      setBusy(false);
    }
  }

  if (!bill) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close overlay"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            disabled={phase === "processing"}
            onClick={() => {
              if (phase === "processing") return;
              if (phase === "success" || phase === "celebrate") return;
              onOpenChange(false);
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribute-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative z-[201] mb-0 w-full max-w-lg overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:mb-0 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 px-6 pb-6 pt-5 text-white">
              <div className="mb-3 flex items-start justify-between gap-3">
                <Badge variant="demo" className="bg-white/20">
                  DEMO MODE — No real charges
                </Badge>
                {phase === "pick" && (
                  <button
                    type="button"
                    className="rounded-full bg-white/15 p-1.5 hover:bg-white/25"
                    aria-label="Close"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <h2 id="contribute-title" className="text-2xl font-bold">
                {mode === "remaining" ? "Pay remaining balance" : "Help pay this bill"}
              </h2>
              <p className="mt-1 text-sm text-white/85">
                {bill.statement.billerName} · {bill.statement.locationLabel}
              </p>
            </div>

            <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-6 py-5">
              {phase === "pick" && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => {
                      const minor = majorToMinor(p, bill.currencyCode);
                      const disabled = minor > remaining;
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelected(p)}
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
                      onClick={() => setSelected("custom")}
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
                      onClick={() => setSelected("remaining")}
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
                      <Row
                        label="Bill contribution"
                        value={formatMoney(fees.contributionMinor, bill.currencyCode)}
                      />
                      <Row
                        label="BillBless platform fee"
                        value={formatMoney(fees.platformFeeMinor, bill.currencyCode)}
                      />
                      <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold dark:border-zinc-700">
                        <span>Total charge</span>
                        <span>{formatMoney(fees.totalChargedMinor, bill.currencyCode)}</span>
                      </div>
                      <p className="flex items-start gap-1.5 text-[11px] text-zinc-500">
                        <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                        Recipients pay $0 platform fees. Swiping never charges you — confirmation
                        required.
                      </p>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex flex-col gap-2 pb-2">
                    <Button
                      type="button"
                      data-testid="confirm-contribution"
                      size="lg"
                      className="w-full gap-2"
                      disabled={!fees || amountMinor <= 0 || busy}
                      onClick={() => {
                        toast.message("Confirming contribution…");
                        void handleConfirm();
                      }}
                    >
                      <Heart className="h-4 w-4" fill="currentColor" />
                      Confirm (Demo)
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {phase === "processing" && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                  <p className="font-medium">Processing simulated payment…</p>
                </div>
              )}

              {(phase === "success" || phase === "celebrate") && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950"
                  >
                    {fullyFunded ? (
                      <PartyPopper className="h-8 w-8" />
                    ) : (
                      <Check className="h-8 w-8" />
                    )}
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
                    <div className="flex gap-1 text-2xl" aria-hidden>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          ❤
                        </motion.span>
                      ))}
                    </div>
                  )}
                  <Button type="button" className="mt-2 w-full" onClick={() => onOpenChange(false)}>
                    Continue swiping
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
