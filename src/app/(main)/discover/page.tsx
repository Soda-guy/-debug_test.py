"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { SwipeDeck } from "@/components/bills/swipe-deck";
import { ContributionModal } from "@/components/contribution/contribution-modal";
import type { BillPublic } from "@/types";
import { toast } from "sonner";

export default function DiscoverPage() {
  const router = useRouter();
  const [bill, setBill] = useState<BillPublic | null>(null);
  const [mode, setMode] = useState<"partial" | "remaining">("partial");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col overflow-hidden overscroll-none touch-manipulation">
      <AppHeader />
      <div className="relative z-0 min-h-0 flex-1 overscroll-none">
        <SwipeDeck
          onContribute={(b, m) => {
            setBill(b);
            setMode(m);
            setOpen(true);
          }}
        />
      </div>
      <ContributionModal
        bill={bill}
        mode={mode}
        open={open}
        onOpenChange={setOpen}
        onRequireAuth={() => {
          toast.message("Sign in to contribute", {
            description: "Create a free demo account to record simulated contributions.",
          });
          setOpen(false);
          router.push("/auth/login?next=/discover");
        }}
        onSuccess={() => {
          toast.success("Contribution recorded (demo)");
        }}
      />
    </div>
  );
}
