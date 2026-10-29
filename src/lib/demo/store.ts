"use client";

import type {
  AdminAuditLog,
  BillPublic,
  BillStatus,
  Contribution,
  ExploreFilters,
  PaymentTransaction,
  Profile,
  SavedBill,
  UserNotification,
} from "@/types";
import { SEED_BILLS, shuffle } from "./seed-bills";
import { calculateFees } from "@/lib/payments/fee-calculator";
import { getPaymentProvider } from "@/lib/payments/provider";
import { fundingPercent, remainingBalance } from "@/lib/money/format";

const STORAGE_KEY = "billbless_demo_v1";

export interface DemoState {
  bills: BillPublic[];
  contributions: Contribution[];
  transactions: PaymentTransaction[];
  savedBills: SavedBill[];
  notifications: UserNotification[];
  auditLogs: AdminAuditLog[];
  user: Profile | null;
  skippedBillIds: string[];
  sessionSeenIds: string[];
  demoMode: true;
}

function defaultUser(): Profile {
  return {
    id: "user_demo_001",
    email: "demo@billbless.app",
    displayName: "Alex Demo",
    role: "user",
    preferredCurrency: "USD",
    locale: "en-US",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    emailVerified: true,
    notifications: {
      contributionUpdates: true,
      billFunding: true,
      marketing: false,
      pushEnabled: true,
    },
    privacy: {
      showOnLeaderboard: false,
      anonymizeContributions: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function defaultAdmin(): Profile {
  return {
    ...defaultUser(),
    id: "admin_demo_001",
    email: "admin@billbless.app",
    displayName: "BillBless Admin",
    role: "admin",
  };
}

function initialState(): DemoState {
  return {
    bills: structuredClone(SEED_BILLS),
    contributions: [],
    transactions: [],
    savedBills: [],
    notifications: [
      {
        id: "notif_welcome",
        userId: "user_demo_001",
        title: "Welcome to BillBless Demo",
        body: "Swipe right to contribute, left to skip, up to pay remaining. No real money moves in demo mode.",
        read: false,
        href: "/discover",
        createdAt: new Date().toISOString(),
      },
    ],
    auditLogs: [],
    user: null,
    skippedBillIds: [],
    sessionSeenIds: [],
    demoMode: true,
  };
}

let memoryState: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  if (memoryState) return memoryState;
  if (typeof window === "undefined") {
    memoryState = initialState();
    return memoryState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryState = JSON.parse(raw) as DemoState;
      return memoryState;
    }
  } catch {
    /* ignore corrupt storage */
  }
  memoryState = initialState();
  return memoryState;
}

function persist() {
  if (typeof window === "undefined" || !memoryState) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): DemoState {
  return load();
}

export function resetDemoData() {
  memoryState = initialState();
  persist();
}

/** Auth — demo mode local accounts */
export function loginDemo(email: string, password: string): Profile {
  void password; // Demo auth accepts any password meeting client-side Zod rules
  const state = load();
  const isAdmin = email.toLowerCase().includes("admin");
  const user = isAdmin ? defaultAdmin() : { ...defaultUser(), email };
  state.user = user;
  persist();
  return user;
}

export function registerDemo(email: string, displayName: string, password: string): Profile {
  void password;
  const state = load();
  const user: Profile = {
    ...defaultUser(),
    id: `user_${Date.now()}`,
    email,
    displayName,
    emailVerified: false,
  };
  state.user = user;
  state.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: "Verify your email",
    body: "DEMO: Email verification is simulated. Your account is ready to use.",
    read: false,
    createdAt: new Date().toISOString(),
  });
  persist();
  return user;
}

export function logoutDemo() {
  const state = load();
  state.user = null;
  persist();
}

export function updateProfile(patch: Partial<Profile>) {
  const state = load();
  if (!state.user) return null;
  state.user = { ...state.user, ...patch, updatedAt: new Date().toISOString() };
  persist();
  return state.user;
}

export function requestAccountDeletion() {
  return updateProfile({ deletionRequestedAt: new Date().toISOString() });
}

/** Feed helpers */
export function getVerifiedBills(): BillPublic[] {
  return load().bills.filter((b) =>
    ["VERIFIED", "FULLY_FUNDED", "PAYMENT_PENDING"].includes(b.status)
  );
}

export function getDiscoverFeed(): BillPublic[] {
  const state = load();
  const excluded = new Set([...state.skippedBillIds, ...state.sessionSeenIds]);
  const feed = getVerifiedBills().filter(
    (b) => !excluded.has(b.id) && b.status === "VERIFIED" && remainingBalance(b.amountDueMinor, b.amountFundedMinor) > 0
  );
  return shuffle(feed);
}

export function markSkipped(billId: string) {
  const state = load();
  if (!state.skippedBillIds.includes(billId)) state.skippedBillIds.push(billId);
  if (!state.sessionSeenIds.includes(billId)) state.sessionSeenIds.push(billId);
  persist();
}

export function markSeen(billId: string) {
  const state = load();
  if (!state.sessionSeenIds.includes(billId)) state.sessionSeenIds.push(billId);
  persist();
}

export function resetDiscoverSession() {
  const state = load();
  state.sessionSeenIds = [];
  state.skippedBillIds = [];
  persist();
}

export function filterBills(filters: ExploreFilters): BillPublic[] {
  let bills = getVerifiedBills();
  if (filters.countryCode) bills = bills.filter((b) => b.countryCode === filters.countryCode);
  if (filters.region) bills = bills.filter((b) => b.region === filters.region);
  if (filters.category) bills = bills.filter((b) => b.category === filters.category);
  if (filters.currencyCode) bills = bills.filter((b) => b.currencyCode === filters.currencyCode);
  if (filters.urgency) bills = bills.filter((b) => b.urgency === filters.urgency);
  if (filters.minAmountMinor != null)
    bills = bills.filter((b) => b.amountDueMinor >= filters.minAmountMinor!);
  if (filters.maxAmountMinor != null)
    bills = bills.filter((b) => b.amountDueMinor <= filters.maxAmountMinor!);
  if (filters.dueBefore) bills = bills.filter((b) => b.dueDate <= filters.dueBefore!);
  if (filters.minFundingPercent != null)
    bills = bills.filter(
      (b) => fundingPercent(b.amountDueMinor, b.amountFundedMinor) >= filters.minFundingPercent!
    );
  if (filters.maxFundingPercent != null)
    bills = bills.filter(
      (b) => fundingPercent(b.amountDueMinor, b.amountFundedMinor) <= filters.maxFundingPercent!
    );
  return shuffle(bills);
}

export function getBillById(id: string): BillPublic | undefined {
  return load().bills.find((b) => b.id === id);
}

/** Contributions — concurrency-safe via sequential store updates */
export async function contributeToBill(opts: {
  billId: string;
  amountMinor: number;
  idempotencyKey: string;
}): Promise<{ ok: true; contribution: Contribution; fullyFunded: boolean } | { ok: false; error: string }> {
  const state = load();
  if (!state.user) return { ok: false, error: "Sign in to contribute." };

  // Idempotency
  const existing = state.contributions.find((c) => c.idempotencyKey === opts.idempotencyKey);
  if (existing) return { ok: true, contribution: existing, fullyFunded: false };

  const bill = state.bills.find((b) => b.id === opts.billId);
  if (!bill) return { ok: false, error: "Bill not found." };
  if (bill.status !== "VERIFIED") return { ok: false, error: "Bill is not open for contributions." };

  const remaining = remainingBalance(bill.amountDueMinor, bill.amountFundedMinor);
  if (opts.amountMinor <= 0) return { ok: false, error: "Amount must be positive." };
  if (opts.amountMinor > remaining) {
    return { ok: false, error: `Amount exceeds remaining balance of ${remaining} minor units.` };
  }

  const fees = calculateFees(opts.amountMinor, bill.currencyCode);
  const provider = getPaymentProvider();
  const intent = await provider.createPaymentIntent({
    amountMinor: fees.totalChargedMinor,
    currencyCode: bill.currencyCode,
    idempotencyKey: opts.idempotencyKey,
    metadata: { billId: bill.id, contributionMinor: String(opts.amountMinor) },
    feeBreakdown: fees,
  });
  const confirmed = await provider.confirmPayment(intent.id);

  if (confirmed.status !== "SUCCEEDED") {
    return { ok: false, error: "Simulated payment failed." };
  }

  const contribution: Contribution = {
    id: `contrib_${Date.now()}`,
    billId: bill.id,
    donorUserId: state.user.id,
    amountMinor: opts.amountMinor,
    currencyCode: bill.currencyCode,
    platformFeeMinor: fees.platformFeeMinor,
    processingFeeMinor: fees.processingFeeMinor,
    taxMinor: fees.taxMinor,
    totalChargedMinor: fees.totalChargedMinor,
    status: "SUCCEEDED",
    idempotencyKey: opts.idempotencyKey,
    isSimulated: true,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const tx: PaymentTransaction = {
    id: `tx_${Date.now()}`,
    contributionId: contribution.id,
    provider: provider.name,
    providerRef: confirmed.providerRef,
    status: "SUCCEEDED",
    amountMinor: fees.totalChargedMinor,
    currencyCode: bill.currencyCode,
    idempotencyKey: opts.idempotencyKey,
    isSimulated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Apply funding (single-threaded JS + persist acts as concurrency control in demo)
  bill.amountFundedMinor += opts.amountMinor;
  bill.contributorCount += 1;
  bill.updatedAt = new Date().toISOString();

  const fullyFunded = bill.amountFundedMinor >= bill.amountDueMinor;
  if (fullyFunded) {
    bill.status = "FULLY_FUNDED";
    // NOTE: FULLY_FUNDED ≠ PAID. Biller payment is a separate workflow.
    state.notifications.unshift({
      id: `notif_funded_${Date.now()}`,
      userId: state.user.id,
      title: "Bill fully funded! 🎉",
      body: `${bill.statement.billerName} reached its funding goal. Biller payment is still pending confirmation.`,
      read: false,
      href: "/impact",
      createdAt: new Date().toISOString(),
    });
  }

  state.contributions.unshift(contribution);
  state.transactions.unshift(tx);
  if (!state.sessionSeenIds.includes(bill.id)) state.sessionSeenIds.push(bill.id);

  state.notifications.unshift({
    id: `notif_contrib_${Date.now()}`,
    userId: state.user.id,
    title: "Contribution confirmed (DEMO)",
    body: `Simulated contribution recorded for ${bill.statement.billerName}. No real funds moved.`,
    read: false,
    href: "/impact",
    createdAt: new Date().toISOString(),
  });

  persist();
  return { ok: true, contribution, fullyFunded };
}

export function toggleSaveBill(billId: string) {
  const state = load();
  if (!state.user) return false;
  const idx = state.savedBills.findIndex(
    (s) => s.billId === billId && s.userId === state.user!.id
  );
  if (idx >= 0) {
    state.savedBills.splice(idx, 1);
    persist();
    return false;
  }
  state.savedBills.push({
    userId: state.user.id,
    billId,
    createdAt: new Date().toISOString(),
  });
  persist();
  return true;
}

export function isBillSaved(billId: string): boolean {
  const state = load();
  if (!state.user) return false;
  return state.savedBills.some((s) => s.billId === billId && s.userId === state.user!.id);
}

export function getUserContributions(): Contribution[] {
  const state = load();
  if (!state.user) return [];
  return state.contributions.filter((c) => c.donorUserId === state.user!.id);
}

export function getImpactStats() {
  const contribs = getUserContributions().filter((c) => c.status === "SUCCEEDED");
  const billIds = new Set(contribs.map((c) => c.billId));
  const state = load();
  const fullyFunded = [...billIds].filter((id) => {
    const b = state.bills.find((x) => x.id === id);
    return b && (b.status === "FULLY_FUNDED" || b.status === "PAID" || b.status === "PAYMENT_PENDING");
  }).length;

  const byMonth: Record<string, number> = {};
  for (const c of contribs) {
    const key = c.createdAt.slice(0, 7);
    byMonth[key] = (byMonth[key] ?? 0) + c.amountMinor;
  }

  return {
    totalContributedMinor: contribs.reduce((s, c) => s + c.amountMinor, 0),
    totalFeesMinor: contribs.reduce((s, c) => s + c.platformFeeMinor, 0),
    billsSupported: billIds.size,
    fullyFunded,
    contributionCount: contribs.length,
    byMonth,
    currencyCode: contribs[0]?.currencyCode ?? "USD",
  };
}

/** Bill submission */
export function submitBill(input: {
  category: BillPublic["category"];
  countryCode: string;
  region?: string;
  currencyCode: string;
  amountDueMinor: number;
  dueDate: string;
  urgency: BillPublic["urgency"];
  billerName: string;
  statementTitle: string;
}): BillPublic {
  const state = load();
  const bill: BillPublic = {
    id: `bill_user_${Date.now()}`,
    category: input.category,
    status: "PENDING_REVIEW",
    countryCode: input.countryCode,
    region: input.region,
    currencyCode: input.currencyCode,
    amountDueMinor: input.amountDueMinor,
    amountFundedMinor: 0,
    contributorCount: 0,
    dueDate: input.dueDate,
    urgency: input.urgency,
    statement: {
      billerName: input.billerName.toUpperCase(),
      statementTitle: input.statementTitle.toUpperCase(),
      theme: {
        primaryColor: "#e11d48",
        accentColor: "#fb923c",
        headerBg: "#e11d48",
        logoText: input.billerName.slice(0, 4).toUpperCase(),
        fontStyle: "utility",
      },
      dueDateLabel: input.dueDate,
      amountDueLabel: `${input.currencyCode} ${(input.amountDueMinor / 100).toFixed(2)}`,
      locationLabel: `${input.region ?? ""}, ${input.countryCode}`.replace(/^, /, ""),
      footerNote: "DEMO · Pending human verification · Document stored privately (simulated)",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.bills.unshift(bill);
  if (state.user) {
    state.notifications.unshift({
      id: `notif_submit_${Date.now()}`,
      userId: state.user.id,
      title: "Bill submitted for review",
      body: "Your bill is PENDING_REVIEW. It will not appear in Discover until an admin verifies it.",
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  audit("bill.submit", "bill", bill.id, { status: "PENDING_REVIEW" });
  persist();
  return bill;
}

/** Admin */
export function getPendingBills(): BillPublic[] {
  return load().bills.filter((b) =>
    ["PENDING_REVIEW", "NEEDS_INFORMATION"].includes(b.status)
  );
}

export function reviewBill(
  billId: string,
  decision: "approve" | "reject" | "needs_info",
  notes?: string
) {
  const state = load();
  const bill = state.bills.find((b) => b.id === billId);
  if (!bill) return null;
  const map: Record<typeof decision, BillStatus> = {
    approve: "VERIFIED",
    reject: "REJECTED",
    needs_info: "NEEDS_INFORMATION",
  };
  bill.status = map[decision];
  if (decision === "approve") {
    bill.verifiedAt = new Date().toISOString();
    bill.statement.footerNote = "DEMO · Verified synthetic statement · PII redacted";
  }
  bill.updatedAt = new Date().toISOString();
  audit(`bill.${decision}`, "bill", billId, { notes });
  persist();
  return bill;
}

export function getPlatformStats() {
  const state = load();
  const succeeded = state.contributions.filter((c) => c.status === "SUCCEEDED");
  return {
    totalBills: state.bills.length,
    verifiedBills: state.bills.filter((b) => b.status === "VERIFIED").length,
    pendingReview: getPendingBills().length,
    totalContributions: succeeded.length,
    platformRevenueMinor: succeeded.reduce((s, c) => s + c.platformFeeMinor, 0),
    volumeMinor: succeeded.reduce((s, c) => s + c.amountMinor, 0),
  };
}

function audit(action: string, resourceType: string, resourceId: string, metadata?: Record<string, unknown>) {
  const state = load();
  state.auditLogs.unshift({
    id: `audit_${Date.now()}`,
    actorId: state.user?.id ?? "system",
    action,
    resourceType,
    resourceId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}

export function markNotificationsRead() {
  const state = load();
  if (!state.user) return;
  state.notifications
    .filter((n) => n.userId === state.user!.id)
    .forEach((n) => {
      n.read = true;
    });
  persist();
}

export function getUserNotifications(): UserNotification[] {
  const state = load();
  if (!state.user) return [];
  return state.notifications.filter((n) => n.userId === state.user!.id);
}

export function getUserSubmittedBills(): BillPublic[] {
  // In demo, user-submitted bills have ids starting with bill_user_
  return load().bills.filter((b) => b.id.startsWith("bill_user_"));
}
