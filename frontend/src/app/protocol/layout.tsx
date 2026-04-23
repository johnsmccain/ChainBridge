import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Protocol",
  description:
    "Explore ChainBridge protocol features: governance, liquidity pools, referral campaigns, and advanced order modes.",
  alternates: { canonical: "/protocol" },
  openGraph: {
    title: "Protocol Explorer | ChainBridge",
    description:
      "Governance, liquidity pools, referral campaigns, and advanced order modes on ChainBridge.",
    url: "/protocol",
  },
};

export default function ProtocolLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
