import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Transaction Explorer",
  description:
    "View live and historical cross-chain swap transactions processed by ChainBridge, with on-chain proof verification.",
  alternates: { canonical: "/transactions" },
  openGraph: {
    title: "Transaction Explorer | ChainBridge",
    description:
      "Live and historical cross-chain swap transactions with on-chain proof verification.",
    url: "/transactions",
  },
};

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
