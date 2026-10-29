import type { FeeBreakdown, TransactionStatus } from "@/types";

/**
 * Modular payment provider interface for future Stripe (or other) integration.
 * Demo mode uses SimulatedPaymentProvider — no real charges.
 */
export interface PaymentIntentRequest {
  amountMinor: number;
  currencyCode: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
  feeBreakdown: FeeBreakdown;
}

export interface PaymentIntentResult {
  id: string;
  status: TransactionStatus;
  providerRef: string;
  isSimulated: boolean;
  message: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly isLive: boolean;
  createPaymentIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult>;
  confirmPayment(intentId: string): Promise<PaymentIntentResult>;
  refund(intentId: string, amountMinor?: number): Promise<PaymentIntentResult>;
}

export class SimulatedPaymentProvider implements PaymentProvider {
  readonly name = "simulated";
  readonly isLive = false;

  async createPaymentIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const id = `sim_pi_${req.idempotencyKey.slice(0, 12)}`;
    return {
      id,
      status: "PENDING",
      providerRef: id,
      isSimulated: true,
      message: "DEMO MODE — no real charge will be made.",
    };
  }

  async confirmPayment(intentId: string): Promise<PaymentIntentResult> {
    // Simulate brief processing
    await new Promise((r) => setTimeout(r, 600));
    return {
      id: intentId,
      status: "SUCCEEDED",
      providerRef: intentId,
      isSimulated: true,
      message: "Simulated payment succeeded. No real funds moved.",
    };
  }

  async refund(intentId: string): Promise<PaymentIntentResult> {
    return {
      id: intentId,
      status: "REFUNDED",
      providerRef: intentId,
      isSimulated: true,
      message: "Simulated refund completed.",
    };
  }
}

let provider: PaymentProvider = new SimulatedPaymentProvider();

export function getPaymentProvider(): PaymentProvider {
  return provider;
}

/** Swap in a live provider only after legal/compliance review */
export function setPaymentProvider(p: PaymentProvider) {
  provider = p;
}
