import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { BridleProvider } from "@/lib/store";
import { SolanaProvider } from "@/components/solana-provider";

export const metadata: Metadata = {
  title: "BRIDLE | Resource Orchestration Network",
  description: "Bind AI agents, GPUs, APIs, PCs, wallets, and datasets into one programmable network."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>
          <BridleProvider>{children}</BridleProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
