"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { billSubmitSchema, type BillSubmitInput } from "@/lib/validations/schemas";
import { CATEGORY_LABELS, URGENCY_LABELS } from "@/lib/demo/seed-bills";
import { enabledCountries, enabledCurrencies, getCountry } from "@/lib/money/currencies";
import { majorToMinor } from "@/lib/money/format";
import { submitBill } from "@/lib/demo/store";
import { useDemoUser } from "@/hooks/use-demo-store";

export default function PostBillPage() {
  const user = useDemoUser();
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BillSubmitInput>({
    resolver: zodResolver(billSubmitSchema),
    defaultValues: {
      category: "electric",
      countryCode: "US",
      currencyCode: "USD",
      urgency: "medium",
      amountMajor: 100,
      dueDate: "",
      billerName: "",
      statementTitle: "SERVICE STATEMENT",
      region: "",
    },
  });

  const countryCode = form.watch("countryCode");
  const country = getCountry(countryCode);

  async function onSubmit(data: BillSubmitInput) {
    if (!user) {
      toast.message("Sign in required");
      router.push("/auth/login?next=/post");
      return;
    }
    if (!fileName) {
      toast.error("Please attach a bill document (PDF, JPG, PNG, or WEBP)");
      return;
    }
    setSubmitting(true);
    try {
      const bill = submitBill({
        category: data.category,
        countryCode: data.countryCode,
        region: data.region,
        currencyCode: data.currencyCode,
        amountDueMinor: majorToMinor(data.amountMajor, data.currencyCode),
        dueDate: data.dueDate,
        urgency: data.urgency,
        billerName: data.billerName,
        statementTitle: data.statementTitle,
      });
      toast.success("Bill submitted for review", {
        description: `${bill.id} is PENDING_REVIEW and hidden from Discover until verified.`,
      });
      form.reset();
      setFileName(null);
      router.push("/profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader title="Post Bill" />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold">Request help</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload a bill for verification. Donors only ever see a sanitized, redacted statement.
          </p>
        </div>

        <div className="mb-4 space-y-2 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Privacy & verification
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs opacity-90">
            <li>Originals stay in a private bucket (simulated in demo).</li>
            <li>PII is redacted before donor-facing display — not CSS overlays.</li>
            <li>A document alone is never proof a bill is legitimate.</li>
            <li>Human review required before publishing to Discover.</li>
          </ul>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Bill document</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-zinc-300 bg-white px-4 py-8 transition-colors hover:border-rose-400 dark:border-zinc-700 dark:bg-zinc-950">
              <FileUp className="h-8 w-8 text-rose-500" />
              <span className="text-sm font-medium">
                {fileName ?? "Tap to upload PDF, JPG, PNG, or WEBP"}
              </span>
              <span className="text-xs text-zinc-400">Max 10MB · Private storage</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    toast.error("File too large (max 10MB)");
                    return;
                  }
                  const allowed = [
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                  ];
                  if (!allowed.includes(file.type)) {
                    toast.error("Unsupported file type");
                    return;
                  }
                  setFileName(file.name);
                  form.setValue("fileName", file.name);
                  form.setValue("fileType", file.type);
                  toast.message("File staged (demo)", {
                    description: "Upload is simulated — no file leaves this browser.",
                  });
                }}
              />
            </label>
            <p className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Lock className="h-3 w-3" />
              Demo mode does not transmit documents to a server.
            </p>
          </div>

          <Field label="Biller name" error={form.formState.errors.billerName?.message}>
            <Input placeholder="e.g. DTE Energy" {...form.register("billerName")} />
          </Field>

          <Field label="Statement title" error={form.formState.errors.statementTitle?.message}>
            <Input {...form.register("statementTitle")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className="select-field" {...form.register("category")}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Urgency">
              <select className="select-field" {...form.register("urgency")}>
                {Object.entries(URGENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Country">
              <select
                className="select-field"
                {...form.register("countryCode")}
                onChange={(e) => {
                  form.setValue("countryCode", e.target.value);
                  const c = getCountry(e.target.value);
                  if (c) form.setValue("currencyCode", c.defaultCurrency);
                  form.setValue("region", "");
                }}
              >
                {enabledCountries().map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Region / State">
              <select className="select-field" {...form.register("region")}>
                <option value="">Select</option>
                {country?.regions?.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount due" error={form.formState.errors.amountMajor?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register("amountMajor", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Currency">
              <select className="select-field" {...form.register("currencyCode")}>
                {enabledCurrencies().map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date" error={form.formState.errors.dueDate?.message}>
              <Input type="date" {...form.register("dueDate")} />
            </Field>
          </div>

          <Badge variant="demo">Status after submit: PENDING_REVIEW</Badge>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for verification"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
