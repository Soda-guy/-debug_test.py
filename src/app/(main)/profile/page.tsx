"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDemoUser, useDemoStore } from "@/hooks/use-demo-store";
import {
  logoutDemo,
  updateProfile,
  requestAccountDeletion,
  getUserSubmittedBills,
  resetDemoData,
} from "@/lib/demo/store";
import { enabledCurrencies } from "@/lib/money/currencies";
import { formatMoney, fundingPercent } from "@/lib/money/format";

export default function ProfilePage() {
  const user = useDemoUser();
  const store = useDemoStore();
  const router = useRouter();
  const submitted = getUserSubmittedBills();

  if (!user) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AppHeader title="Profile" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <UserRound className="h-12 w-12 text-rose-500" />
          <h1 className="font-display text-2xl font-bold">Your account</h1>
          <p className="text-sm text-zinc-500">
            One account for helping and requesting help. No separate donor/recipient types.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/register">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader title="Profile" />
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-xl font-bold text-white">
            {user.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{user.displayName}</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="mt-1 flex gap-1">
              <Badge variant={user.emailVerified ? "success" : "warning"}>
                {user.emailVerified ? "Email verified" : "Unverified (demo)"}
              </Badge>
              {user.role === "admin" && <Badge variant="demo">Admin</Badge>}
            </div>
          </div>
        </div>

        <section className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4" /> Account
          </h2>
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input
              defaultValue={user.displayName}
              onBlur={(e) => {
                updateProfile({ displayName: e.target.value });
                toast.success("Profile updated");
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred currency</Label>
            <select
              className="select-field"
              value={user.preferredCurrency}
              onChange={(e) => {
                updateProfile({ preferredCurrency: e.target.value });
                toast.success("Currency preference saved");
              }}
            >
              {enabledCurrencies().map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="flex items-center gap-2 font-semibold">
            <Bell className="h-4 w-4" /> Notifications
          </h2>
          <ToggleRow
            label="Contribution updates"
            checked={user.notifications.contributionUpdates}
            onChange={(v) =>
              updateProfile({
                notifications: { ...user.notifications, contributionUpdates: v },
              })
            }
          />
          <ToggleRow
            label="Bill funding alerts"
            checked={user.notifications.billFunding}
            onChange={(v) =>
              updateProfile({
                notifications: { ...user.notifications, billFunding: v },
              })
            }
          />
          <ToggleRow
            label="Marketing"
            checked={user.notifications.marketing}
            onChange={(v) =>
              updateProfile({
                notifications: { ...user.notifications, marketing: v },
              })
            }
          />
        </section>

        <section className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4" /> Privacy
          </h2>
          <ToggleRow
            label="Anonymize my contributions"
            checked={user.privacy.anonymizeContributions}
            onChange={(v) =>
              updateProfile({
                privacy: { ...user.privacy, anonymizeContributions: v },
              })
            }
          />
          <ToggleRow
            label="Show on leaderboard"
            checked={user.privacy.showOnLeaderboard}
            onChange={(v) =>
              updateProfile({
                privacy: { ...user.privacy, showOnLeaderboard: v },
              })
            }
          />
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Your submitted bills</h2>
          {submitted.length === 0 && (
            <p className="text-sm text-zinc-500">No submissions yet.</p>
          )}
          {submitted.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex justify-between">
                <p className="font-medium">{b.statement.billerName}</p>
                <Badge variant="secondary">{b.status}</Badge>
              </div>
              <p className="text-xs text-zinc-500">
                {formatMoney(b.amountDueMinor, b.currencyCode)} ·{" "}
                {fundingPercent(b.amountDueMinor, b.amountFundedMinor)}% funded
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Payment history</h2>
          <p className="text-sm text-zinc-500">
            {store.contributions.filter((c) => c.donorUserId === user.id).length} simulated
            transaction(s). See My Impact for details.
          </p>
        </section>

        {user.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40"
          >
            <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
              <Shield className="h-4 w-4" />
              Admin dashboard
            </div>
            <ChevronRight className="h-4 w-4 text-rose-400" />
          </Link>
        )}

        <div className="space-y-2 pt-2">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              logoutDemo();
              toast.message("Signed out");
              router.push("/discover");
            }}
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-zinc-500"
            onClick={() => {
              resetDemoData();
              toast.success("Demo data reset");
              router.refresh();
            }}
          >
            <Globe className="h-4 w-4" /> Reset demo data
          </Button>
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={() => {
              requestAccountDeletion();
              toast.message("Deletion requested", {
                description: "DEMO: Account marked for deletion. A real system would start a cooling-off period.",
              });
            }}
          >
            <Trash2 className="h-4 w-4" /> Request account deletion
          </Button>
          {user.deletionRequestedAt && (
            <p className="text-center text-xs text-red-500">
              Deletion requested {new Date(user.deletionRequestedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
