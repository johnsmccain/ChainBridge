import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your ChainBridge profile, wallet preferences, and cross-chain settings from a single dashboard.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "User Dashboard | ChainBridge",
    description: "Manage your profile, preferences, and wallet settings on ChainBridge.",
    url: "/dashboard",
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
