"use client";

import { useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AdvancedFilterDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function AdvancedFilterDrawer({
  open,
  title,
  onClose,
  onClear,
  children,
}: AdvancedFilterDrawerProps) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-background shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand-500" />
              <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="rounded-lg border border-border p-2 text-text-secondary transition hover:bg-surface-overlay hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

          <footer className="flex items-center justify-between border-t border-border px-5 py-4">
            <Button variant="ghost" onClick={onClear}>
              Clear
            </Button>
            <Button onClick={onClose}>Done</Button>
          </footer>
        </div>
      </aside>
    </div>
  );
}
