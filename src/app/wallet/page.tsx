"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CircleDollarSign, Send, ShieldCheck, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CurrencyLine, StatCard } from "@/components/retro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBridle } from "@/lib/store";
import { BRIDLE_HOLDER_MIN_BALANCE, BRIDLE_TOKEN_MINT, getBridleTokenBalance } from "@/lib/bridle-token";
import { buildX402UsdcTransfer, configuredSolanaNetwork, configuredUsdcMint } from "@/lib/solana-usdc";
import { cn, resourceTypeLabel } from "@/lib/utils";
import type { X402Settlement } from "@/lib/types";

function settlementTone(status: X402Settlement["status"]) {
  return {
    draft: "border-white/40 text-zinc-300",
    "pending-signature": "border-sky-200/70 bg-sky-400/10 text-sky-100",
    submitted: "border-yellow-100/70 bg-yellow-400/10 text-yellow-100",
    confirmed: "border-emerald-200/70 bg-emerald-400/10 text-emerald-200",
    failed: "border-red-200/70 bg-red-400/10 text-red-100"
  }[status];
}

export default function WalletPage() {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const {
    wallet,
    resources,
    x402Settlements,
    tokenGate,
    connectWallet,
    createX402Settlement,
    markX402Settlement,
    updateTokenGate
  } = useBridle();
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountUsdc, setAmountUsdc] = useState("1.25");
  const [selectedResourceId, setSelectedResourceId] = useState(resources[0]?.id || "");
  const [memo, setMemo] = useState("x402:BRIDLE:resource-settlement");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingHolder, setIsVerifyingHolder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [holderError, setHolderError] = useState<string | null>(null);
  const connectWalletRef = useRef(connectWallet);
  const usdcMint = configuredUsdcMint();
  const solanaNetwork = configuredSolanaNetwork();

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
  const effectiveRecipientAddress =
    recipientAddress || process.env.NEXT_PUBLIC_BRIDLE_USDC_RECIPIENT || publicKey?.toBase58() || "";
  const confirmedUsdc = x402Settlements
    .filter((settlement) => settlement.status === "confirmed")
    .reduce((total, settlement) => total + settlement.amountUsdc, 0);
  const selectedResource = resources.find((resource) => resource.id === selectedResourceId);

  async function verifyBridleHoldings() {
    setHolderError(null);

    if (!publicKey || !connected) {
      setHolderError("Connect a Solana wallet before verifying $BRIDLE holdings.");
      return;
    }

    setIsVerifyingHolder(true);
    try {
      const balance = await getBridleTokenBalance(connection, publicKey);
      updateTokenGate({
        holderAddress: publicKey.toBase58(),
        balance,
        status: balance >= BRIDLE_HOLDER_MIN_BALANCE ? "active" : "insufficient",
        verifiedAt: new Date().toISOString()
      });
    } catch (error) {
      updateTokenGate({
        holderAddress: publicKey.toBase58(),
        balance: 0,
        status: "unverified",
        verifiedAt: new Date().toISOString()
      });
      setHolderError(error instanceof Error ? error.message : "Unable to verify $BRIDLE holdings.");
    } finally {
      setIsVerifyingHolder(false);
    }
  }

  async function submitSettlement(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!publicKey || !connected) {
      setFormError("Connect a Solana wallet before sending USDC.");
      return;
    }

    const amount = Number(amountUsdc);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a valid USDC amount greater than zero.");
      return;
    }

    let recipient: PublicKey;
    let mint: PublicKey;
    try {
      recipient = new PublicKey(effectiveRecipientAddress);
      mint = new PublicKey(usdcMint);
    } catch {
      setFormError("Recipient address or USDC mint is not a valid Solana public key.");
      return;
    }

    const settlement = createX402Settlement({
      resourceId: selectedResourceId || undefined,
      payerAddress: publicKey.toBase58(),
      recipientAddress: recipient.toBase58(),
      amountUsdc: amount,
      memo,
      usdcMint: mint.toBase58(),
      network: solanaNetwork
    });

    setIsSubmitting(true);
    try {
      const transaction = buildX402UsdcTransfer({
        payer: publicKey,
        recipient,
        amountUsdc: amount,
        memo,
        usdcMint: mint
      });
      const signature = await sendTransaction(transaction, connection);
      markX402Settlement(settlement.id, {
        status: "submitted",
        signature,
        payerAddress: publicKey.toBase58()
      });

      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          ...latestBlockhash
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        markX402Settlement(settlement.id, {
          status: "failed",
          signature,
          error: JSON.stringify(confirmation.value.err)
        });
      } else {
        markX402Settlement(settlement.id, {
          status: "confirmed",
          signature
        });
      }
    } catch (error) {
      markX402Settlement(settlement.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "USDC transfer failed."
      });
      setFormError(error instanceof Error ? error.message : "USDC transfer failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell title="Wallet" kicker="x402 USDC settlement path">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Treasury connection</CardTitle>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Connect a Solana wallet and settle x402 resource usage with real SPL USDC transfers. No internal credit
                ledger is used for these records.
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
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">SOL balance</div>
                <div className="mt-2 font-pixel text-lg text-white">{balance.toFixed(4)} SOL</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <StatCard detail="confirmed x402 USDC" icon={CircleDollarSign} label="settled" value={`${confirmedUsdc.toFixed(2)} USDC`} />
          <Card>
            <CardTitle>Settlement routing</CardTitle>
            <div className="mt-4">
              <CurrencyLine label="chain" value="Solana" />
              <CurrencyLine label="network" value={solanaNetwork} />
              <CurrencyLine label="asset" value="USDC SPL" />
              <CurrencyLine label="mint" value={`${usdcMint.slice(0, 4)}...${usdcMint.slice(-4)}`} />
              <CurrencyLine label="x402 mode" value="wallet transfer" />
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>$BRIDLE holder gate</CardTitle>
              <ShieldCheck className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border border-white/20 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">status</div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Badge
                      className={
                        tokenGate.status === "active"
                          ? "border-emerald-200/70 bg-emerald-400/10 text-emerald-200"
                          : tokenGate.status === "insufficient"
                            ? "border-yellow-100/70 bg-yellow-400/10 text-yellow-100"
                            : "border-white/40 text-zinc-300"
                      }
                    >
                      {tokenGate.status}
                    </Badge>
                    <span className="font-pixel text-xs text-white">{tokenGate.priorityBoost} boost</span>
                  </div>
                </div>
                <CurrencyLine label="mint" value={`${BRIDLE_TOKEN_MINT.slice(0, 4)}...${BRIDLE_TOKEN_MINT.slice(-4)}`} />
                <CurrencyLine label="balance" value={`${tokenGate.balance.toLocaleString()} $BRIDLE`} />
                <CurrencyLine label="minimum" value={`${tokenGate.minBalance.toLocaleString()} $BRIDLE`} />
                {holderError ? <div className="border border-red-200/60 p-3 text-xs text-red-100">{holderError}</div> : null}
                <Button disabled={!connected || isVerifyingHolder} onClick={verifyBridleHoldings} type="button" variant="ghost">
                  <ShieldCheck className="h-4 w-4" />
                  {isVerifyingHolder ? "Verifying..." : "Verify holdings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>x402 USDC transfer</CardTitle>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              This creates associated token accounts when needed, sends a checked USDC transfer, and writes the signature
              back into BRIDLE settlement history.
            </p>
          </div>
          <WalletCards className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitSettlement}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">resource usage</span>
                <select
                  className="border-2 border-white/40 bg-black px-4 py-3 text-white"
                  onChange={(event) => {
                    const resource = resources.find((item) => item.id === event.target.value);
                    setSelectedResourceId(event.target.value);
                    if (resource) {
                      setMemo(`x402:BRIDLE:${resource.name}:USDC`);
                    }
                  }}
                  value={selectedResourceId}
                >
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} / {resourceTypeLabel(resource.type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">amount</span>
                <input
                  className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                  inputMode="decimal"
                  onChange={(event) => setAmountUsdc(event.target.value)}
                  value={amountUsdc}
                />
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">USDC recipient</span>
              <input
                className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                onChange={(event) => setRecipientAddress(event.target.value)}
                placeholder="Solana recipient address"
                value={effectiveRecipientAddress}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">x402 memo</span>
              <input
                className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                onChange={(event) => setMemo(event.target.value)}
                value={memo}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">selected resource</div>
                <div className="mt-2 font-pixel text-[10px] leading-5 text-white">{selectedResource?.name || "none"}</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">payer token acct</div>
                <div className="mt-2 text-xs leading-5 text-zinc-300">created idempotently if missing</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">recipient token acct</div>
                <div className="mt-2 text-xs leading-5 text-zinc-300">created idempotently if missing</div>
              </div>
            </div>
            {formError ? <div className="border border-red-200/60 p-3 text-sm text-red-100">{formError}</div> : null}
            <Button disabled={!connected || isSubmitting} type="submit">
              <Send className="h-4 w-4" />
              {isSubmitting ? "Sending USDC..." : "Send x402 USDC"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>x402 settlement history</CardTitle>
          <Badge>{x402Settlements.length} records</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {x402Settlements.map((settlement) => {
            const resource = resources.find((item) => item.id === settlement.resourceId);

            return (
              <div className="border border-white/20 p-4" key={settlement.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <span className="font-pixel text-xs text-white">{settlement.amountUsdc.toFixed(2)} USDC</span>
                  <Badge className={cn(settlementTone(settlement.status))}>{settlement.status}</Badge>
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {resource?.name || "resource settlement"} / {settlement.network}
                </div>
                <div className="mt-3 break-all text-xs leading-5 text-zinc-400">to: {settlement.recipientAddress}</div>
                <div className="mt-2 break-all text-xs leading-5 text-zinc-400">memo: {settlement.memo}</div>
                {settlement.signature ? (
                  <div className="mt-2 break-all text-xs leading-5 text-emerald-200">sig: {settlement.signature}</div>
                ) : null}
                {settlement.error ? <div className="mt-2 text-xs leading-5 text-red-100">{settlement.error}</div> : null}
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {new Date(settlement.updatedAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </AppShell>
  );
}
