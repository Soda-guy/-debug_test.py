/**
 * Supabase configuration helpers.
 * Service-role keys must NEVER be imported into client components.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-project-url"
  );
}

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

/** Server-only — call from Route Handlers / Server Actions only */
export function getSupabaseServiceRoleKey(): string | undefined {
  if (typeof window !== "undefined") {
    throw new Error("Service role key must never be accessed on the client");
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
