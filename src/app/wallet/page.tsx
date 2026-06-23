"use client";

import { useEffect, useRef, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CurrencyLine, StatCard } from "@/components/retro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBridle } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export default function WalletPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { wallet, payouts, connectWallet } = useBridle();
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const connectWalletRef = useRef(connectWallet);

  useEffect(() => {
    connectWalletRef.current = connectWallet;
  }, [connectWallet]);

  useEffect(() => {
    async function loadBalance() {
      if (!publicKey) {
        return;
      }

      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;
      setLiveBalance(sol);
      connectWalletRef.current(publicKey.toBase58(), sol);
    }

    loadBalance().catch(() => setLiveBalance(null));
  }, [connection, publicKey]);

  const displayedAddress = publicKey?.toBase58() || wallet?.address || "No Solana wallet connected";
  const balance = liveBalance ?? wallet?.balanceSol ?? 0;
  const settled = payouts.filter((payout) => payout.status === "settled").reduce((total, payout) => total + payout.amountUsd, 0);

  return (
    <AppShell title="Wallet" kicker="solana-first settlement path">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Treasury connection</CardTitle>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Connect a Solana wallet for payout routing. The MVP stores payout intent and balance display while keeping
                settlement architecture ready for production.
              </p>
            </div>
            <Badge className={connected ? "border-emerald-200 text-emerald-200" : "border-white/40 text-zinc-400"}>
              {connected ? "connected" : "demo"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <WalletMultiButton />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="border border-white/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">address</div>
                <div className="mt-2 break-all font-pixel text-[10px] leading-5 text-white">{displayedAddress}</div>
              </div>
              <div className="border border-white/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">balance</div>
                <div className="mt-2 font-pixel text-lg text-white">{balance.toFixed(4)} SOL</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <StatCard detail="settled payouts" icon={WalletCards} label="paid out" value={formatCurrency(settled)} />
          <Card>
            <CardTitle>Settlement routing</CardTitle>
            <div className="mt-4">
              <CurrencyLine label="chain" value="Solana" />
              <CurrencyLine label="payout enabled" value={wallet?.payoutEnabled ? "YES" : "NO"} />
              <CurrencyLine label="routing mode" value="BRIDLE escrow-ready" />
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Payout records</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {payouts.map((payout) => (
            <div className="border border-white/20 p-4" key={payout.id}>
              <div className="flex justify-between gap-4">
                <span className="font-pixel text-xs text-white">{formatCurrency(payout.amountUsd)}</span>
                <Badge>{payout.status}</Badge>
              </div>
              <div className="mt-3 break-all text-xs text-zinc-400">{payout.txSignature}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{new Date(payout.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
