"use client";

import { Bell, KeyRound, RotateCcw, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBridle } from "@/lib/store";

export default function SettingsPage() {
  const { user, apiKeys, resetDemo } = useBridle();

  return (
    <AppShell title="Settings" kicker="operator preferences and access control">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">name</span>
              <input className="border-2 border-white/40 bg-black px-4 py-3 text-white" readOnly value={user?.name || "Guest"} />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">email</span>
              <input className="border-2 border-white/40 bg-black px-4 py-3 text-white" readOnly value={user?.email || "guest"} />
            </label>
            <div className="border border-white/20 p-4 text-sm leading-6 text-zinc-400">
              Production auth should be backed by Supabase Auth with row-level security. The MVP keeps demo sessions local
              so the product can run immediately.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interface</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["CRT scanlines", "enabled"],
              ["Monochrome command UI", "enabled"],
              ["Pixel hover selection", "enabled"],
              ["Reduced accent colors", "enabled"]
            ].map(([label, value]) => (
              <div className="flex justify-between border border-white/20 p-3" key={label}>
                <span className="text-sm text-zinc-300">{label}</span>
                <Badge>{value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API keys</CardTitle>
            <KeyRound className="h-5 w-5" />
          </CardHeader>
          <CardContent className="space-y-3">
            {apiKeys.map((key) => (
              <div className="border border-white/20 p-4" key={key.id}>
                <div className="flex justify-between gap-4">
                  <span className="font-pixel text-xs text-white">{key.label}</span>
                  <span className="text-xs text-zinc-500">{key.prefix}...</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {key.scopes.map((scope) => (
                    <Badge key={scope}>{scope}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security and notifications</CardTitle>
            <Shield className="h-5 w-5" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 border border-white/20 p-4">
              <Bell className="h-5 w-5" />
              <div>
                <div className="font-pixel text-xs text-white">Route + health alerts</div>
                <p className="mt-2 text-sm text-zinc-400">Notify when uptime, error rate, or payout status changes.</p>
              </div>
            </div>
            <Button onClick={resetDemo} variant="danger">
              <RotateCcw className="h-4 w-4" />
              Reset demo state
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
