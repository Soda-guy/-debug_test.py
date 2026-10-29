import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateFees } from "@/lib/payments/fee-calculator";
import { rateLimit } from "@/lib/utils/rate-limit";

const schema = z.object({
  amountMinor: z.number().int().positive(),
  currencyCode: z.string().length(3),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`fees:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = schema.parse(await req.json());
    const fees = calculateFees(body.amountMinor, body.currencyCode);
    return NextResponse.json({ fees, demoMode: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
