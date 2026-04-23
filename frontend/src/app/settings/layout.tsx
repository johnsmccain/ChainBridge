import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure ChainBridge display preferences, realtime notifications, and preferred network mode.",
  alternates: { canonical: "/settings" },
  openGraph: {
    title: "Settings | ChainBridge",
    description:
      "Configure display preferences, realtime notifications, and preferred network mode on ChainBridge.",
    url: "/settings",
  },
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
