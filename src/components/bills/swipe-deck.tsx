"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  getDiscoverFeed,
  markSeen,
  markSkipped,
  resetDiscoverSession,
  toggleSaveBill,
  isBillSaved,
} from "@/lib/demo/store";
import { useDemoStore } from "@/hooks/use-demo-store";
import { cn } from "@/lib/utils/cn";

const SWIPE_THRESHOLD = 110;
const UP_THRESHOLD = -90;

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
  const surfaceRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const reload = useCallback(() => {
    setDeck(getDiscoverFeed());
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDeck((prev) =>
      prev.map((card) => store.bills.find((b) => b.id === card.id) ?? card)
    );
  }, [store.bills]);

  const current = deck[0];
  const next = deck[1];

  useEffect(() => {
    if (current) setSaved(isBillSaved(current.id));
  }, [current]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-16, 16]);
  const opacity = useTransform(x, [-220, -120, 0, 120, 220], [0.45, 1, 1, 1, 0.45]);

  // Fresh card = origin. Shared motion values otherwise keep the old exit offset.
  useEffect(() => {
    x.set(0);
    y.set(0);
    setExitDir(null);
    setStamp(null);
  }, [current?.id, x, y]);

  // Block pinch-zoom / multi-touch on the swipe surface (mobile Safari)
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const blockMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const blockGesture = (e: Event) => {
      e.preventDefault();
    };
    const blockTouchMoveWhileDrag = (e: TouchEvent) => {
      if (draggingRef.current || e.touches.length > 1) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", blockMultiTouch, { passive: false });
    el.addEventListener("touchmove", blockTouchMoveWhileDrag, { passive: false });
    el.addEventListener("gesturestart", blockGesture, { passive: false } as AddEventListenerOptions);
    el.addEventListener("gesturechange", blockGesture, { passive: false } as AddEventListenerOptions);
    el.addEventListener("gestureend", blockGesture, { passive: false } as AddEventListenerOptions);

    return () => {
      el.removeEventListener("touchstart", blockMultiTouch);
      el.removeEventListener("touchmove", blockTouchMoveWhileDrag);
      el.removeEventListener("gesturestart", blockGesture);
      el.removeEventListener("gesturechange", blockGesture);
      el.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  useEffect(() => {
    const unsubX = x.on("change", (v) => {
      const yv = y.get();
      if (yv < -70) setStamp("pay_all");
      else if (v > 55) setStamp("contribute");
      else if (v < -55) setStamp("skip");
      else setStamp(null);
    });
    const unsubY = y.on("change", (v) => {
      const xv = x.get();
      if (v < -70) setStamp("pay_all");
      else if (xv > 55) setStamp("contribute");
      else if (xv < -55) setStamp("skip");
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
      draggingRef.current = false;
      x.set(0);
      y.set(0);
    },
    [x, y]
  );

  const triggerExit = useCallback(
    (action: SwipeAction) => {
      if (!current || exitDir) return;
      setExitDir(action);
      setStamp(action);
      draggingRef.current = false;
      if (action === "contribute") onContribute(current, "partial");
      if (action === "pay_all") onContribute(current, "remaining");
      const bill = current;
      window.setTimeout(() => advance(action, bill), 260);
    },
    [advance, current, exitDir, onContribute]
  );

  const onDragStart = () => {
    draggingRef.current = true;
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    draggingRef.current = false;
    if (!current || exitDir) return;
    const { offset, velocity } = info;
    if (offset.y < UP_THRESHOLD || velocity.y < -750) {
      triggerExit("pay_all");
      return;
    }
    if (offset.x > SWIPE_THRESHOLD || velocity.x > 550) {
      triggerExit("contribute");
      return;
    }
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -550) {
      triggerExit("skip");
      return;
    }
    // Snap back cleanly
    setStamp(null);
  };

  const exitAnimation = useMemo(() => {
    if (exitDir === "skip") return { x: -520, y: 28, opacity: 0, rotate: -22 };
    if (exitDir === "contribute") return { x: 520, y: 28, opacity: 0, rotate: 22 };
    if (exitDir === "pay_all") return { x: 0, y: -720, opacity: 0, rotate: 0 };
    return { x: 0, y: 0, opacity: 1 };
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
    <div className="relative flex h-full flex-col overscroll-none">
      <div
        ref={surfaceRef}
        className="swipe-surface relative mx-auto w-full max-w-md min-h-0 flex-1 overflow-hidden px-3 pb-2 pt-1"
      >
        {next && (
          <div className="pointer-events-none absolute inset-x-3 top-3 bottom-2 scale-[0.96] opacity-60">
            <BillStatementCard bill={next} className="h-full" compact />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            className="absolute inset-x-3 top-1 bottom-2 touch-none will-change-transform"
            style={{
              x,
              y,
              rotate,
              opacity,
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
            initial={{ scale: 0.98, opacity: 0.85 }}
            drag={!exitDir}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.85}
            dragMomentum={false}
            dragPropagation={false}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            animate={exitAnimation}
            transition={
              exitDir
                ? { type: "spring", stiffness: 380, damping: 32 }
                : { type: "spring", stiffness: 420, damping: 36 }
            }
            whileDrag={{ cursor: "grabbing" }}
          >
            <SwipeStamp type={stamp} />
            <BillStatementCard
              bill={current}
              className="h-full select-none pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-20 flex shrink-0 items-center justify-center gap-4 bg-gradient-to-t from-white via-white to-transparent px-4 pb-5 pt-2 dark:from-zinc-950 dark:via-zinc-950">
        <Button
          type="button"
          variant="skip"
          size="icon"
          aria-label="Skip bill"
          className="pointer-events-auto shadow-lg touch-manipulation"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerExit("skip");
          }}
          disabled={!!exitDir}
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          aria-label={saved ? "Unsave bill" : "Save bill"}
          className={cn(
            "pointer-events-auto border-2 border-zinc-200 shadow-md touch-manipulation dark:border-zinc-700",
            saved && "border-amber-400 text-amber-500"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved(toggleSaveBill(current.id));
          }}
        >
          <Bookmark className={cn("h-5 w-5", saved && "fill-amber-500")} />
        </Button>
        <Button
          type="button"
          variant="super"
          size="iconSm"
          aria-label="Pay remaining balance"
          className="pointer-events-auto shadow-lg touch-manipulation"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerExit("pay_all");
          }}
          disabled={!!exitDir}
        >
          <Zap className="h-5 w-5" fill="currentColor" />
        </Button>
        <Button
          type="button"
          variant="like"
          size="icon"
          aria-label="Contribute to bill"
          data-testid="contribute-button"
          className="pointer-events-auto shadow-lg touch-manipulation"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!current || exitDir) return;
            triggerExit("contribute");
          }}
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
