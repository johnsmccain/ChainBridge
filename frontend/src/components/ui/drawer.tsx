"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type DrawerSide = "left" | "right" | "bottom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: DrawerSide;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
  footer?: React.ReactNode;
}

const sideStyles: Record<DrawerSide, { base: string; open: string; closed: string }> = {
  right: {
    base: "fixed top-0 right-0 h-full border-l border-border",
    open: "translate-x-0",
    closed: "translate-x-full",
  },
  left: {
    base: "fixed top-0 left-0 h-full border-r border-border",
    open: "translate-x-0",
    closed: "-translate-x-full",
  },
  bottom: {
    base: "fixed bottom-0 left-0 right-0 border-t border-border",
    open: "translate-y-0",
    closed: "translate-y-full",
  },
};

const widthStyles: Record<"sm" | "md" | "lg" | "full", string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-lg",
  full: "w-full",
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  side = "right",
  size = "md",
  className,
  footer,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const uid = useId();
  const titleId = `${uid}-drawer-title`;
  const descId = `${uid}-drawer-desc`;
  const { base, open: openClass, closed: closedClass } = sideStyles[side];

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = getFocusableElements(panelRef.current);
    (focusable[0] ?? panelRef.current).focus();
  }, [open]);

  useEffect(() => {
    if (!open && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = getFocusableElements(panelRef.current);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          base,
          side !== "bottom" ? widthStyles[size] : "max-h-[90dvh]",
          "flex flex-col bg-surface-raised shadow-2xl transition-transform duration-300 ease-in-out focus:outline-none",
          open ? openClass : closedClass,
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex-shrink-0 border-b border-border px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold text-text-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="mt-0.5 text-sm text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted transition hover:bg-surface-overlay hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-border px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
