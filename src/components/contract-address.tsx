"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRIDLE_TOKEN_MINT } from "@/lib/bridle-token";

export const BRIDLE_CONTRACT_ADDRESS = BRIDLE_TOKEN_MINT;

export function ContractAddress() {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    await navigator.clipboard.writeText(BRIDLE_CONTRACT_ADDRESS);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mt-6 max-w-2xl border-2 border-white/60 bg-black/80 p-4 shadow-[6px_6px_0_rgba(255,255,255,0.12)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-pixel text-[10px] uppercase tracking-[0.22em] text-white">$BRIDLE contract</span>
        <Button onClick={copyAddress} size="sm" type="button" variant="ghost">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="break-all border border-white/20 bg-white/5 p-3 font-mono text-xs leading-6 text-zinc-200">
        {BRIDLE_CONTRACT_ADDRESS}
      </div>
    </div>
  );
}
