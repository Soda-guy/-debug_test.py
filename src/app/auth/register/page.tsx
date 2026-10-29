"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations/schemas";
import { registerDemo } from "@/lib/demo/store";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      registerDemo(data.email, data.displayName, data.password);
      toast.success("Account created", {
        description: "DEMO: Email verification is simulated.",
      });
      router.push("/discover");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Join BillBless</h1>
        <p className="mt-1 text-sm text-zinc-500">
          One account to help others and request help.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Display name</Label>
          <Input {...form.register("displayName")} />
          {form.formState.errors.displayName && (
            <p className="text-xs text-red-500">{form.formState.errors.displayName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Confirm password</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-rose-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
