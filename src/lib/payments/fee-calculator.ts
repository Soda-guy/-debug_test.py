import type { FeeBreakdown } from "@/types";
import { getCurrency } from "@/lib/money/currencies";

export interface FeeConfig {
  /** Flat platform fee in minor units of the contribution currency (default $1.00 = 100) */
  platformFeeMinor: number;
  /** Whether to estimate processing fees for display (not charged in demo) */
  passProcessingFees: boolean;
  /** Estimated processing rate in basis points (e.g. 290 = 2.9%) */
  processingRateBps: number;
  /** Fixed processing fee in minor units */
  processingFixedMinor: number;
  /** Whether to estimate tax (default false — donations typically not taxed) */
  estimateTax: boolean;
  taxRateBps: number;
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  platformFeeMinor: 100, // $1.00 for USD-like currencies; scaled for others in calc
  passProcessingFees: false, // legally varies by jurisdiction — off by default
  processingRateBps: 290,
  processingFixedMinor: 30,
  estimateTax: false,
  taxRateBps: 0,
};

/**
 * Configurable fee calculator. All math in integer minor units.
 * Platform fee is $1 flat per successful contribution for 2-decimal currencies.
 * For 0-decimal (JPY) uses 100 yen; for 3-decimal uses 1000 fils ≈ 1 major unit.
 */
export function calculateFees(
  contributionMinor: number,
  currencyCode: string,
  config: FeeConfig = DEFAULT_FEE_CONFIG
): FeeBreakdown {
  const currency = getCurrency(currencyCode);
  const notes: string[] = [];

  // Scale $1 platform fee to currency minor units (1 major unit)
  const platformFeeMinor =
    currencyCode === "USD"
      ? config.platformFeeMinor
      : 1 * 10 ** currency.minorUnits;

  notes.push(`BillBless platform fee: flat ${platformFeeMinor} minor units (1.00 major)`);

  let processingFeeMinor = 0;
  if (config.passProcessingFees) {
    // processing = round((amount + fixed) * rate / (1 - rate)) roughly; use simple estimate
    processingFeeMinor =
      Math.round((contributionMinor * config.processingRateBps) / 10000) +
      config.processingFixedMinor;
    notes.push(
      "Processing fee estimate shown for transparency; legality of passing fees varies by jurisdiction."
    );
  } else {
    notes.push("Processing fees are absorbed by the platform in this configuration.");
  }

  let taxMinor = 0;
  if (config.estimateTax && config.taxRateBps > 0) {
    taxMinor = Math.round((contributionMinor * config.taxRateBps) / 10000);
    notes.push("Tax estimate — donations are often not subject to sales tax; verify locally.");
  } else {
    notes.push("No sales tax assumed on contributions.");
  }

  const totalChargedMinor =
    contributionMinor + platformFeeMinor + processingFeeMinor + taxMinor;

  return {
    contributionMinor,
    platformFeeMinor,
    processingFeeMinor,
    taxMinor,
    totalChargedMinor,
    currencyCode,
    notes,
  };
}
