"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command, History, Layers, Navigation, TerminalSquare } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { DEMO_ORDER_OWNER, useMockOrders, useOrderBookStore } from "@/hooks/useOrderBook";
import { useMockSwaps, useSwapHistoryStore } from "@/hooks/useSwapHistory";
import { useI18n } from "@/components/i18n/I18nProvider";
import { NAV_LINKS } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

type CommandPaletteItemType = "route" | "order" | "swap" | "command";

type CommandPaletteItem = {
  id: string;
  type: CommandPaletteItemType;
  title: string;
  subtitle: string;
  keywords: string;
  action: () => void;
};

const MAX_ORDER_RESULTS = 6;
const MAX_SWAP_RESULTS = 6;

function toSectionLabel(type: CommandPaletteItemType, t: (key: string) => string) {
  switch (type) {
    case "route":
      return t("commandPalette.routes");
    case "order":
      return t("commandPalette.orders");
    case "swap":
      return t("commandPalette.swaps");
    default:
      return t("commandPalette.commands");
  }
}

export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t, localizePath } = useI18n();
  const { seedMockOrders } = useMockOrders();
  const { seedMockSwaps } = useMockSwaps();
  const orders = useOrderBookStore((state) => state.orders);
  const swaps = useSwapHistoryStore((state) => state.swaps);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    seedMockOrders(DEMO_ORDER_OWNER);
    seedMockSwaps();
  }, [seedMockOrders, seedMockSwaps]);

  const routeItems = useMemo<CommandPaletteItem[]>(
    () =>
      NAV_LINKS.map((link) => ({
        id: `route:${link.href}`,
        type: "route",
        title: t(link.key),
        subtitle: link.href,
        keywords: `${t(link.key)} ${link.href} route`,
        action: () => {
          router.push(localizePath(link.href));
          setOpen(false);
        },
      })),
    [localizePath, router, t]
  );

  const orderItems = useMemo<CommandPaletteItem[]>(() => {
    return [...orders]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_ORDER_RESULTS)
      .map((order) => ({
        id: `order:${order.id}`,
        type: "order",
        title: `${order.pair} (${order.status})`,
        subtitle: `${order.chainIn} -> ${order.chainOut}`,
        keywords: `${order.id} ${order.pair} ${order.tokenIn} ${order.tokenOut} ${order.chainIn} ${order.chainOut} order`,
        action: () => {
          router.push(localizePath(`/orders?ord_q=${encodeURIComponent(order.pair)}`));
          setOpen(false);
        },
      }));
  }, [localizePath, orders, router]);

  const swapItems = useMemo<CommandPaletteItem[]>(() => {
    return [...swaps]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_SWAP_RESULTS)
      .map((swap) => ({
        id: `swap:${swap.id}`,
        type: "swap",
        title: `${swap.from} -> ${swap.to} (${swap.status})`,
        subtitle: `${swap.amount} for ${swap.toAmount}`,
        keywords: `${swap.id} ${swap.from} ${swap.to} ${swap.status} swap`,
        action: () => {
          router.push(localizePath("/swaps"));
          setOpen(false);
        },
      }));
  }, [localizePath, router, swaps]);

  const commandItems = useMemo<CommandPaletteItem[]>(
    () => [
      {
        id: "command:new-swap",
        type: "command",
        title: "Start new swap",
        subtitle: "Open swap creation flow",
        keywords: "swap new create",
        action: () => {
          router.push(localizePath("/swap"));
          setOpen(false);
        },
      },
      {
        id: "command:theme",
        type: "command",
        title: "Toggle theme",
        subtitle: `Current: ${resolvedTheme ?? "system"}`,
        keywords: "theme dark light toggle appearance",
        action: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          setOpen(false);
        },
      },
      {
        id: "command:orders",
        type: "command",
        title: "Open order management",
        subtitle: "Jump to order controls",
        keywords: "orders manage filter",
        action: () => {
          router.push(localizePath("/orders"));
          setOpen(false);
        },
      },
    ],
    [localizePath, resolvedTheme, router, setTheme]
  );

  const allItems = useMemo(
    () => [...routeItems, ...orderItems, ...swapItems, ...commandItems],
    [commandItems, orderItems, routeItems, swapItems]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return allItems;
    return allItems.filter((item) =>
      `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase().includes(normalizedQuery)
    );
  }, [allItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  return (
    <>
      <Button
        variant="secondary"
        className="hidden md:inline-flex"
        icon={<Command className="h-4 w-4" />}
        aria-label={t("commandPalette.openButton")}
        onClick={() => setOpen(true)}
      >
        Quick Actions
        <kbd className="ml-2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
          Ctrl+K
        </kbd>
      </Button>

      <Button
        variant="secondary"
        size="icon"
        className="md:hidden"
        icon={<Command className="h-4 w-4" />}
        aria-label={t("commandPalette.openButton")}
        onClick={() => setOpen(true)}
      />

      <div
        className={cn(
          "fixed inset-0 z-[80] transition",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        <div className="absolute left-1/2 top-[12vh] w-[min(720px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
              {t("commandPalette.title")}
            </p>
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    Math.min(current + 1, Math.max(0, filteredItems.length - 1))
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }
                if (event.key === "Enter" && filteredItems[activeIndex]) {
                  event.preventDefault();
                  filteredItems[activeIndex].action();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
              placeholder={t("commandPalette.placeholder")}
              aria-label={t("commandPalette.placeholder")}
              role="combobox"
              aria-expanded={open}
              aria-controls="command-palette-list"
              aria-activedescendant={
                filteredItems[activeIndex] ? `cp-item-${filteredItems[activeIndex].id}` : undefined
              }
            />
          </div>

          <ul
            id="command-palette-list"
            role="listbox"
            className="max-h-[420px] overflow-y-auto p-2"
          >
            {filteredItems.length === 0 ? (
              <li className="p-5 text-sm text-text-secondary">{t("commandPalette.empty")}</li>
            ) : (
              filteredItems.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    id={`cp-item-${item.id}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => item.action()}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition",
                      index === activeIndex ? "bg-brand-500/15" : "hover:bg-surface-overlay"
                    )}
                  >
                    <div className="mt-0.5 rounded-lg border border-border bg-surface-overlay p-1.5">
                      {item.type === "route" && (
                        <Navigation className="h-3.5 w-3.5 text-brand-500" />
                      )}
                      {item.type === "order" && <Layers className="h-3.5 w-3.5 text-emerald-500" />}
                      {item.type === "swap" && <History className="h-3.5 w-3.5 text-amber-400" />}
                      {item.type === "command" && (
                        <TerminalSquare className="h-3.5 w-3.5 text-text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-secondary">{item.subtitle}</p>
                    </div>
                    <span className="ml-auto rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-text-muted">
                      {toSectionLabel(item.type, t)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
