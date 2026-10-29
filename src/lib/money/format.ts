import { getCurrency } from "./currencies";

/**
 * Format money from integer minor units. Never uses floating-point arithmetic
 * for the underlying amount — only for display scaling via integer division.
 */
export function formatMoney(
  amountMinor: number,
  currencyCode: string,
  locale = "en-US"
): string {
  const currency = getCurrency(currencyCode);
  const divisor = 10 ** currency.minorUnits;
  // Integer-safe display: format as decimal string then use Intl
  const negative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const whole = Math.floor(abs / divisor);
  const fraction = abs % divisor;
  const fractionStr =
    currency.minorUnits === 0
      ? ""
      : `.${fraction.toString().padStart(currency.minorUnits, "0")}`;
  const numeric = Number(`${negative ? "-" : ""}${whole}${fractionStr}`);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currency.minorUnits,
      maximumFractionDigits: currency.minorUnits,
    }).format(numeric);
  } catch {
    return `${currency.symbol}${whole}${fractionStr}`;
  }
}

export function majorToMinor(major: number, currencyCode: string): number {
  const currency = getCurrency(currencyCode);
  // Parse via string to avoid float issues when possible
  const str = major.toFixed(currency.minorUnits);
  const [whole, frac = ""] = str.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const w = Math.abs(parseInt(whole, 10) || 0);
  const f = parseInt(frac.padEnd(currency.minorUnits, "0").slice(0, currency.minorUnits) || "0", 10);
  return sign * (w * 10 ** currency.minorUnits + f);
}

export function remainingBalance(amountDueMinor: number, amountFundedMinor: number): number {
  return Math.max(0, amountDueMinor - amountFundedMinor);
}

export function fundingPercent(amountDueMinor: number, amountFundedMinor: number): number {
  if (amountDueMinor <= 0) return 0;
  return Math.min(100, Math.round((amountFundedMinor * 100) / amountDueMinor));
}

export function parseMoneyInput(value: string, currencyCode: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return majorToMinor(num, currencyCode);
}
