"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  buildLocalizedPath,
  getLocaleFromPathname,
  getMessages,
  RTL_LOCALES,
  type I18nMessages,
  type SupportedLocale,
} from "@/lib/i18n/config";

type I18nContextValue = {
  locale: SupportedLocale;
  messages: I18nMessages;
  t: (key: string) => string;
  localizePath: (pathname: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveMessage(messages: I18nMessages, key: string): string | null {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return null;
  }, messages);

  return typeof value === "string" ? value : null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const messages = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages,
      t: (key) => resolveMessage(messages, key) ?? key,
      localizePath: (nextPathname) => buildLocalizedPath(nextPathname, locale),
    }),
    [locale, messages]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
