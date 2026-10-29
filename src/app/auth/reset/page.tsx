"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-zinc-500">
          We&apos;ll send a reset link when Supabase email is configured.
        </p>
      </div>

      {sent ? (
        <div className="rounded-3xl bg-emerald-50 p-4 text-center text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          DEMO: Password reset email simulated for {email}. Check your inbox in production.
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@")) {
              toast.error("Enter a valid email");
              return;
            }
            setSent(true);
            toast.success("Reset link simulated");
          }}
        >
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/auth/login" className="text-rose-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
