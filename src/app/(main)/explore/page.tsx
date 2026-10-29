"use client";

import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { BillStatementCard } from "@/components/bills/bill-statement-card";
import { ContributionModal } from "@/components/contribution/contribution-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { filterBills, resetDiscoverSession } from "@/lib/demo/store";
import { CATEGORY_LABELS, URGENCY_LABELS } from "@/lib/demo/seed-bills";
import { enabledCountries, enabledCurrencies, getCountry } from "@/lib/money/currencies";
import { majorToMinor, fundingPercent, formatMoney } from "@/lib/money/format";
import type { BillCategory, BillPublic, ExploreFilters, Urgency } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const emptyFilters: ExploreFilters = {};

export default function ExplorePage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ExploreFilters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<BillPublic | null>(null);
  const [open, setOpen] = useState(false);

  const bills = useMemo(() => filterBills(filters), [filters]);
  const country = filters.countryCode ? getCountry(filters.countryCode) : undefined;

  function reset() {
    setFilters(emptyFilters);
    resetDiscoverSession();
    toast.success("Filters cleared — worldwide randomized feed restored");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader title="Explore" />
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div>
          <h1 className="font-display text-xl font-bold">Browse bills</h1>
          <p className="text-xs text-zinc-500">{bills.length} verified bills</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            variant={showFilters ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            className="gap-1"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mx-4 mb-3 space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country">
              <select
                className="select-field"
                value={filters.countryCode ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    countryCode: e.target.value || undefined,
                    region: undefined,
                  }))
                }
              >
                <option value="">Worldwide</option>
                {enabledCountries().map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Region">
              <select
                className="select-field"
                value={filters.region ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, region: e.target.value || undefined }))
                }
                disabled={!country}
              >
                <option value="">Any</option>
                {country?.regions?.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                className="select-field"
                value={filters.category ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    category: (e.target.value || undefined) as BillCategory | undefined,
                  }))
                }
              >
                <option value="">All</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select
                className="select-field"
                value={filters.currencyCode ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    currencyCode: e.target.value || undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {enabledCurrencies().map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Urgency">
              <select
                className="select-field"
                value={filters.urgency ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    urgency: (e.target.value || undefined) as Urgency | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {Object.entries(URGENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due before">
              <Input
                type="date"
                value={filters.dueBefore ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dueBefore: e.target.value || undefined }))
                }
              />
            </Field>
            <Field label="Min amount">
              <Input
                type="number"
                placeholder="0"
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minAmountMinor: e.target.value
                      ? majorToMinor(Number(e.target.value), filters.currencyCode ?? "USD")
                      : undefined,
                  }))
                }
              />
            </Field>
            <Field label="Max amount">
              <Input
                type="number"
                placeholder="∞"
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxAmountMinor: e.target.value
                      ? majorToMinor(Number(e.target.value), filters.currencyCode ?? "USD")
                      : undefined,
                  }))
                }
              />
            </Field>
            <Field label="Min funded %">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0"
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minFundingPercent: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </Field>
            <Field label="Max funded %">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="100"
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxFundingPercent: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </Field>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
        {bills.map((bill) => (
          <button
            key={bill.id}
            type="button"
            className="w-full text-left transition-transform active:scale-[0.99]"
            onClick={() => {
              setSelected(bill);
              setOpen(true);
            }}
          >
            <div className="overflow-hidden rounded-3xl shadow-card">
              <BillStatementCard bill={bill} className="max-h-[420px]" compact />
            </div>
            <div className="mt-2 flex items-center gap-2 px-1">
              <Badge variant="secondary">{CATEGORY_LABELS[bill.category]}</Badge>
              <Badge variant={bill.urgency === "critical" ? "danger" : "warning"}>
                {URGENCY_LABELS[bill.urgency]}
              </Badge>
              <span className="ml-auto text-xs text-zinc-500">
                {fundingPercent(bill.amountDueMinor, bill.amountFundedMinor)}% ·{" "}
                {formatMoney(bill.amountDueMinor, bill.currencyCode)}
              </span>
            </div>
          </button>
        ))}
        {bills.length === 0 && (
          <div className="py-16 text-center text-sm text-zinc-500">
            No bills match these filters.
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>

      <ContributionModal
        bill={selected}
        mode="partial"
        open={open}
        onOpenChange={setOpen}
        onRequireAuth={() => {
          setOpen(false);
          router.push("/auth/login?next=/explore");
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
