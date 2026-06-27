"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  Clapperboard,
  Gauge,
  Globe2,
  HeartPulse,
  LogOut,
  Network,
  Plus,
  Settings,
  Shield,
  WalletCards,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelSeparator } from "@/components/retro";
import { useBridle } from "@/lib/store";
import { summarizeResources } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/demo", label: "Demo Mode", icon: Clapperboard },
  { href: "/resources", label: "Registry", icon: Activity },
  { href: "/resources/new", label: "Add Resource", icon: Plus },
  { href: "/orchestration", label: "Orchestration", icon: Workflow },
  { href: "/network", label: "Venue Directory", icon: Network },
  { href: "/marketplace", label: "Marketplace", icon: Globe2 },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "System Health", icon: Shield },
  { href: "/docs", label: "Docs/API", icon: BookOpen }
];

export function AppShell({ children, title, kicker }: { children: React.ReactNode; title: string; kicker?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, resources, signOut, notifications } = useBridle();
  const summary = summarizeResources(resources);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[290px_1fr]">
        <aside className="pixel-corners border-2 border-white bg-black p-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <Link href="/" className="block">
            <div className="font-pixel text-3xl leading-none text-white">BRIDLE</div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.32em] text-zinc-500">control layer</div>
          </Link>
          <PixelSeparator />
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href === "/resources" && pathname.startsWith("/resources/"));

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className="menu-hover flex items-center gap-3 border border-transparent px-3 py-3 text-xs uppercase tracking-[0.2em] text-zinc-300 hover:border-white/30 hover:bg-white/5 hover:text-white"
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <PixelSeparator />
          <div className="space-y-3 text-xs text-zinc-400">
            <div className="flex items-center justify-between">
              <span>resources</span>
              <span className="font-pixel text-white">{summary.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>active</span>
              <span className="font-pixel text-emerald-200">{summary.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>alerts</span>
              <span className="font-pixel text-yellow-100">{notifications.length}</span>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="pixel-corners mb-5 border-2 border-white/70 bg-black/90 p-5">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                  <HeartPulse className="h-3 w-3" />
                  {kicker || "BRIDLE operator console"}
                  <span className="blink">_</span>
                </div>
                <h1 className="font-pixel text-2xl leading-relaxed text-white md:text-4xl">{title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="border border-white/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-zinc-300">
                  {user ? user.email : "guest session"}
                </div>
                {user ? (
                  <Button
                    onClick={() => {
                      signOut();
                      router.push("/login");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <LogOut className="h-3 w-3" />
                    Exit
                  </Button>
                ) : (
                  <Button onClick={() => router.push("/login")} size="sm">
                    Login
                  </Button>
                )}
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
