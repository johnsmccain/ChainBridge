import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse the ChainBridge order book and take open cross-chain swap orders. Permissionless, trustless trading via HTLC contracts.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Order Book Marketplace | ChainBridge",
    description:
      "Browse and fill open cross-chain swap orders. Permissionless, trustless trading via HTLC contracts.",
    url: "/marketplace",
  },
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
