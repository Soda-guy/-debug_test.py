"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/schemas";
import { loginDemo } from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/discover";
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "demo@billbless.app", password: "demopass1" },
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      // Demo auth always available; Supabase wired when configured
      loginDemo(data.email, data.password);
      toast.success("Signed in (demo mode)");
      router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isSupabaseConfigured()
            ? "Supabase auth is configured."
            : "Using local demo authentication — configure Supabase for production."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" autoComplete="current-password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
          onClick={(e) => {
            // Ensure demo login works even if native submit is intercepted
            if (!form.formState.isSubmitting) {
              e.preventDefault();
              void form.handleSubmit(onSubmit)();
            }
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <p>
          <Link href="/auth/reset" className="text-rose-600 hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-zinc-500">
          New here?{" "}
          <Link href="/auth/register" className="font-semibold text-rose-600 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-900">
          Tip: use any email with password ≥8 chars. Include &quot;admin&quot; in the email for
          admin access (e.g. admin@billbless.app).
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
