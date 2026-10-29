import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "BillBless",
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
    supabaseConfigured: isSupabaseConfigured(),
    payments: "simulated",
    timestamp: new Date().toISOString(),
  });
}
