import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "HTLC Manager",
  description:
    "Inspect, claim, and refund your Hash Time-Locked Contracts on Stellar, Bitcoin, and Ethereum via ChainBridge.",
  alternates: { canonical: "/htlcs" },
  openGraph: {
    title: "HTLC Manager | ChainBridge",
    description:
      "Inspect, claim, and refund your Hash Time-Locked Contracts across Stellar, Bitcoin, and Ethereum.",
    url: "/htlcs",
  },
};

export default function HtlcsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
