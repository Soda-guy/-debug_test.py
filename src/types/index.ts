/** BillBless domain types — money always in integer minor units */

export type BillStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "NEEDS_INFORMATION"
  | "VERIFIED"
  | "REJECTED"
  | "FULLY_FUNDED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "EXPIRED";

export type BillCategory =
  | "electric"
  | "water"
  | "gas"
  | "rent"
  | "mortgage"
  | "auto_insurance"
  | "car_payment"
  | "internet"
  | "phone"
  | "medical"
  | "student_loan"
  | "credit_card"
  | "other";

export type Urgency = "low" | "medium" | "high" | "critical";

export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "CHARGEBACK"
  | "CANCELLED";

export type UserRole = "user" | "admin" | "moderator";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  /** Number of decimal places (e.g. 2 for USD, 0 for JPY, 3 for KWD) */
  minorUnits: number;
  enabled: boolean;
}

export interface Country {
  code: string;
  name: string;
  defaultCurrency: string;
  enabled: boolean;
  regions?: string[];
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  preferredCurrency: string;
  locale: string;
  timezone: string;
  emailVerified: boolean;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  createdAt: string;
  updatedAt: string;
  deletionRequestedAt?: string;
}

export interface NotificationPreferences {
  contributionUpdates: boolean;
  billFunding: boolean;
  marketing: boolean;
  pushEnabled: boolean;
}

export interface PrivacySettings {
  showOnLeaderboard: boolean;
  anonymizeContributions: boolean;
}

/** Public bill view — no PII */
export interface BillPublic {
  id: string;
  category: BillCategory;
  status: BillStatus;
  countryCode: string;
  region?: string;
  currencyCode: string;
  /** Original amount owed in minor units */
  amountDueMinor: number;
  /** Amount funded so far in minor units */
  amountFundedMinor: number;
  contributorCount: number;
  dueDate: string;
  urgency: Urgency;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  previousBalanceMinor?: number;
  currentChargesMinor?: number;
  /** Sanitized statement display data */
  statement: SanitizedStatement;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedStatement {
  billerName: string;
  statementTitle: string;
  /** Visual theme for the statement card */
  theme: StatementTheme;
  billingPeriodLabel?: string;
  dueDateLabel: string;
  amountDueLabel: string;
  previousBalanceLabel?: string;
  currentChargesLabel?: string;
  locationLabel: string;
  /** Extra line items shown on statement (sanitized) */
  lineItems?: { label: string; amountLabel: string }[];
  footerNote?: string;
}

export interface StatementTheme {
  primaryColor: string;
  accentColor: string;
  headerBg: string;
  logoText: string;
  fontStyle: "utility" | "corporate" | "medical" | "housing" | "finance";
}

/** Private bill data — never exposed to donors */
export interface BillPrivate {
  billId: string;
  recipientUserId: string;
  originalDocumentPath?: string;
  recipientFullName?: string;
  serviceAddress?: string;
  accountNumberLast4?: string;
  notes?: string;
}

export interface BillDocument {
  id: string;
  billId: string;
  kind: "original" | "sanitized";
  mimeType: string;
  storagePath: string;
  fileSizeBytes: number;
  createdAt: string;
}

export interface BillVerification {
  id: string;
  billId: string;
  reviewerId?: string;
  decision?: "approve" | "reject" | "needs_info";
  notes?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface Contribution {
  id: string;
  billId: string;
  donorUserId: string;
  /** Contribution to the bill in minor units (excludes fees) */
  amountMinor: number;
  currencyCode: string;
  platformFeeMinor: number;
  processingFeeMinor: number;
  taxMinor: number;
  totalChargedMinor: number;
  status: TransactionStatus;
  idempotencyKey: string;
  isSimulated: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  contributionId: string;
  provider: string;
  providerRef?: string;
  status: TransactionStatus;
  amountMinor: number;
  currencyCode: string;
  idempotencyKey: string;
  isSimulated: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BillPayment {
  id: string;
  billId: string;
  amountMinor: number;
  currencyCode: string;
  status: TransactionStatus;
  billerConfirmationRef?: string;
  isSimulated: boolean;
  createdAt: string;
  confirmedAt?: string;
}

export interface SavedBill {
  userId: string;
  billId: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FeeBreakdown {
  contributionMinor: number;
  platformFeeMinor: number;
  processingFeeMinor: number;
  taxMinor: number;
  totalChargedMinor: number;
  currencyCode: string;
  notes: string[];
}

export interface ExploreFilters {
  countryCode?: string;
  region?: string;
  category?: BillCategory;
  minAmountMinor?: number;
  maxAmountMinor?: number;
  dueBefore?: string;
  urgency?: Urgency;
  minFundingPercent?: number;
  maxFundingPercent?: number;
  currencyCode?: string;
}

export interface DemoSession {
  user: Profile | null;
  skippedBillIds: string[];
  contributedBillIds: string[];
}
