"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";

import { Button } from "@/components/ui";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useSettingsStore } from "@/hooks/useSettings";

type ChainKey = "stellar" | "bitcoin" | "ethereum";

type NetworkMetrics = {
  chain: ChainKey;
  label: string;
  feeLabel: string;
  feeValue: number;
  congestion: number;
  feeThreshold: number;
  congestionThreshold: number;
};

type DismissState = {
  dismissed: boolean;
  snoozeUntil: number;
};

const CHAIN_METRICS: Record<ChainKey, Omit<NetworkMetrics, "feeValue" | "congestion">> = {
  stellar: {
    chain: "stellar",
    label: "Stellar",
    feeLabel: "stroops/op",
    feeThreshold: 200,
    congestionThreshold: 82,
  },
  bitcoin: {
    chain: "bitcoin",
    label: "Bitcoin",
    feeLabel: "sat/vB",
    feeThreshold: 16,
    congestionThreshold: 70,
  },
  ethereum: {
    chain: "ethereum",
    label: "Ethereum",
    feeLabel: "gwei",
    feeThreshold: 65,
    congestionThreshold: 78,
  },
};

function parseChain(chain: string): ChainKey | null {
  const normalized = chain.toLowerCase();
  if (normalized.includes("stellar")) return "stellar";
  if (normalized.includes("bitcoin")) return "bitcoin";
  if (normalized.includes("ethereum")) return "ethereum";
  return null;
}

function getSimulatedMetrics(chain: ChainKey, mode: "testnet" | "mainnet"): NetworkMetrics {
  const base = CHAIN_METRICS[chain];
  const scale = mode === "mainnet" ? 1 : 0.6;

  const simulated = {
    stellar: { feeValue: 230, congestion: 64 },
    bitcoin: { feeValue: 19, congestion: 76 },
    ethereum: { feeValue: 88, congestion: 86 },
  }[chain];

  return {
    ...base,
    feeValue: Math.round(simulated.feeValue * scale),
    congestion: Math.round(simulated.congestion * scale + (mode === "mainnet" ? 0 : 15)),
  };
}

interface FeeWarningBannerProps {
  chains: string[];
}

export function FeeWarningBanner({ chains }: FeeWarningBannerProps) {
  const { t } = useI18n();
  const networkMode = useSettingsStore((state) => state.settings.network.mode);

  const chainIds = useMemo(() => {
    const unique = new Set<ChainKey>();
    chains.forEach((chain) => {
      const parsed = parseChain(chain);
      if (parsed) unique.add(parsed);
    });
    return Array.from(unique);
  }, [chains]);

  const storageKey = useMemo(
    () => `chainbridge-fee-banner:${chainIds.join("-") || "none"}`,
    [chainIds]
  );
  const [state, setState] = useLocalStorage<DismissState>(storageKey, {
    dismissed: false,
    snoozeUntil: 0,
  });

  const elevatedMetrics = useMemo(() => {
    return chainIds
      .map((chain) => getSimulatedMetrics(chain, networkMode))
      .filter(
        (metric) =>
          metric.feeValue >= metric.feeThreshold || metric.congestion >= metric.congestionThreshold
      );
  }, [chainIds, networkMode]);

  if (elevatedMetrics.length === 0) return null;
  if (state.dismissed) return null;
  if (state.snoozeUntil > Date.now()) return null;

  const isCritical = elevatedMetrics.some(
    (metric) => metric.congestion >= metric.congestionThreshold + 8
  );

  const affectedChains = elevatedMetrics.map((metric) => metric.label).join(", ");

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 text-sm ${
        isCritical
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 ${isCritical ? "text-red-300" : "text-amber-300"}`}
          />
          <div>
            <p className="font-semibold">
              {isCritical ? t("feeBanner.criticalTitle") : t("feeBanner.warningTitle")}
            </p>
            <p className="mt-1">
              {affectedChains} currently show higher-than-normal fee pressure or block congestion.
            </p>
            <p className="mt-1 text-xs">
              {t("feeBanner.guidancePrefix")}: increase slippage tolerance cautiously, use smaller
              order size, or switch to a lower-congestion chain pair before submission.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {elevatedMetrics.map((metric) => (
                <span
                  key={metric.chain}
                  className="rounded-full border border-current/25 bg-black/20 px-2 py-1"
                >
                  {metric.label}: {metric.feeValue} {metric.feeLabel} | congestion{" "}
                  {metric.congestion}%
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            className="text-xs"
            icon={<Clock3 className="h-3.5 w-3.5" />}
            onClick={() =>
              setState({
                dismissed: false,
                snoozeUntil: Date.now() + 30 * 60 * 1000,
              })
            }
          >
            {t("feeBanner.snooze")}
          </Button>
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() =>
              setState({
                dismissed: true,
                snoozeUntil: 0,
              })
            }
          >
            {t("feeBanner.dismiss")}
          </Button>
        </div>
      </div>
    </div>
  );
}
