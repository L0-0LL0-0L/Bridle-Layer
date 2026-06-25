import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { BridleProvider } from "@/lib/store";
import { SolanaProvider } from "@/components/solana-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "BRIDLE | Resource Orchestration Network",
  description: "Bind AI agents, GPUs, APIs, PCs, wallets, and datasets into one programmable network.",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    title: "BRIDLE",
    description: "Bind idle systems into one living programmable network.",
    images: ["/bridle-repo-pfp.jpeg"]
  }
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
