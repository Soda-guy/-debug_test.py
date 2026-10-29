"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  AnimatePresence,
} from "framer-motion";
import { Heart, RotateCcw, X, Zap, Bookmark } from "lucide-react";
import type { BillPublic } from "@/types";
import { BillStatementCard, SwipeStamp } from "./bill-statement-card";
import { Button } from "@/components/ui/button";
import { getDiscoverFeed, markSeen, markSkipped, resetDiscoverSession, toggleSaveBill, isBillSaved } from "@/lib/demo/store";
import { useDemoStore } from "@/hooks/use-demo-store";
import { cn } from "@/lib/utils/cn";

const SWIPE_THRESHOLD = 120;
const UP_THRESHOLD = -100;

export type SwipeAction = "skip" | "contribute" | "pay_all";

interface SwipeDeckProps {
  onContribute: (bill: BillPublic, mode: "partial" | "remaining") => void;
}

export function SwipeDeck({ onContribute }: SwipeDeckProps) {
  const store = useDemoStore();
  const [deck, setDeck] = useState<BillPublic[]>([]);
  const [exitDir, setExitDir] = useState<SwipeAction | null>(null);
  const [stamp, setStamp] = useState<SwipeAction | null>(null);
  const [saved, setSaved] = useState(false);

  const reload = useCallback(() => {
    setDeck(getDiscoverFeed());
  }, []);

  useEffect(() => {
    reload();
  }, [reload, store.skippedBillIds.length, store.sessionSeenIds.length, store.bills]);

  const current = deck[0];
  const next = deck[1];

  useEffect(() => {
    if (current) setSaved(isBillSaved(current.id));
  }, [current]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -120, 0, 120, 200], [0.5, 1, 1, 1, 0.5]);

  useEffect(() => {
    const unsubX = x.on("change", (v) => {
      const yv = y.get();
      if (yv < -80) setStamp("pay_all");
      else if (v > 60) setStamp("contribute");
      else if (v < -60) setStamp("skip");
      else setStamp(null);
    });
    const unsubY = y.on("change", (v) => {
      const xv = x.get();
      if (v < -80) setStamp("pay_all");
      else if (xv > 60) setStamp("contribute");
      else if (xv < -60) setStamp("skip");
      else setStamp(null);
    });
    return () => {
      unsubX();
      unsubY();
    };
  }, [x, y]);

  const advance = useCallback(
    (action: SwipeAction, bill: BillPublic) => {
      markSeen(bill.id);
      if (action === "skip") markSkipped(bill.id);
      setDeck((d) => d.slice(1));
      setExitDir(null);
      setStamp(null);
      x.set(0);
      y.set(0);

      if (action === "contribute") onContribute(bill, "partial");
      if (action === "pay_all") onContribute(bill, "remaining");
    },
    [onContribute, x, y]
  );

  const triggerExit = useCallback(
    (action: SwipeAction) => {
      if (!current || exitDir) return;
      setExitDir(action);
      setStamp(action);
      // Let animation play then advance
      setTimeout(() => advance(action, current), 280);
    },
    [advance, current, exitDir]
  );

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!current) return;
    const { offset, velocity } = info;
    if (offset.y < UP_THRESHOLD || velocity.y < -800) {
      triggerExit("pay_all");
      return;
    }
    if (offset.x > SWIPE_THRESHOLD || velocity.x > 600) {
      triggerExit("contribute");
      return;
    }
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -600) {
      triggerExit("skip");
      return;
    }
    setStamp(null);
  };

  const exitAnimation = useMemo(() => {
    if (exitDir === "skip") return { x: -480, y: 40, opacity: 0, rotate: -24 };
    if (exitDir === "contribute") return { x: 480, y: 40, opacity: 0, rotate: 24 };
    if (exitDir === "pay_all") return { x: 0, y: -640, opacity: 0, rotate: 0 };
    return undefined;
  }, [exitDir]);

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-950 dark:to-orange-950">
          <Heart className="h-9 w-9 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold">You&apos;re all caught up</h2>
        <p className="max-w-xs text-sm text-zinc-500">
          No more verified bills in this session. Reset to browse the worldwide feed again.
        </p>
        <Button
          onClick={() => {
            resetDiscoverSession();
            reload();
          }}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset feed
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative mx-auto w-full max-w-md flex-1 px-3 pb-2 pt-1">
        {/* Next card preview */}
        {next && (
          <div className="absolute inset-x-3 top-3 bottom-2 scale-[0.96] opacity-60">
            <BillStatementCard bill={next} className="h-full" compact />
          </div>
        )}

        <AnimatePresence>
          <motion.div
            key={current.id}
            className="absolute inset-x-3 top-1 bottom-2 touch-none"
            style={{ x, y, rotate, opacity }}
            drag={!exitDir}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9}
            onDragEnd={onDragEnd}
            animate={exitAnimation}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            whileDrag={{ cursor: "grabbing" }}
          >
            <SwipeStamp type={stamp} />
            <BillStatementCard bill={current} className="h-full select-none" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 px-4 pb-3 pt-1">
        <Button
          variant="skip"
          size="icon"
          aria-label="Skip bill"
          onClick={() => triggerExit("skip")}
          disabled={!!exitDir}
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          aria-label={saved ? "Unsave bill" : "Save bill"}
          className={cn(
            "border-2 border-zinc-200 dark:border-zinc-700",
            saved && "border-amber-400 text-amber-500"
          )}
          onClick={() => setSaved(toggleSaveBill(current.id))}
        >
          <Bookmark className={cn("h-5 w-5", saved && "fill-amber-500")} />
        </Button>
        <Button
          variant="super"
          size="iconSm"
          aria-label="Pay remaining balance"
          onClick={() => triggerExit("pay_all")}
          disabled={!!exitDir}
        >
          <Zap className="h-5 w-5" fill="currentColor" />
        </Button>
        <Button
          variant="like"
          size="icon"
          aria-label="Contribute to bill"
          onClick={() => triggerExit("contribute")}
          disabled={!!exitDir}
        >
          <Heart className="h-7 w-7" fill="currentColor" />
        </Button>
      </div>
      <p className="pb-1 text-center text-[10px] text-zinc-400">
        ← Skip · ↑ Pay remaining · Contribute →
      </p>
    </div>
  );
}
