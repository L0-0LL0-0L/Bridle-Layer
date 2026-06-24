import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

export const USDC_DECIMALS = 6;
export const DEFAULT_DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const DEFAULT_MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export function configuredUsdcMint() {
  return process.env.NEXT_PUBLIC_SOLANA_USDC_MINT || DEFAULT_DEVNET_USDC_MINT;
}

export function configuredSolanaNetwork() {
  const configured = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  return configured === "mainnet-beta" ? "mainnet-beta" : "devnet";
}

export function parseUsdcAmount(amountUsdc: number) {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    throw new Error("USDC amount must be greater than zero.");
  }

  return BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));
}

export function buildX402UsdcTransfer({
  payer,
  recipient,
  amountUsdc,
  memo,
  usdcMint
}: {
  payer: PublicKey;
  recipient: PublicKey;
  amountUsdc: number;
  memo: string;
  usdcMint: PublicKey;
}) {
  const payerTokenAccount = getAssociatedTokenAddressSync(usdcMint, payer);
  const recipientTokenAccount = getAssociatedTokenAddressSync(usdcMint, recipient);
  const amount = parseUsdcAmount(amountUsdc);
  const transaction = new Transaction();

  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(payer, payerTokenAccount, payer, usdcMint),
    createAssociatedTokenAccountIdempotentInstruction(payer, recipientTokenAccount, recipient, usdcMint),
    createTransferCheckedInstruction(payerTokenAccount, usdcMint, recipientTokenAccount, payer, amount, USDC_DECIMALS)
  );

  if (memo.trim()) {
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memo, "utf8")
      })
    );
  }

  return transaction;
}
