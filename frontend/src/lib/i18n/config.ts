export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export type I18nMessages = {
  nav: {
    dashboard: string;
    swap: string;
    market: string;
    orders: string;
    htlcs: string;
    settings: string;
    protocol: string;
    explorer: string;
    about: string;
    admin: string;
  };
  commandPalette: {
    title: string;
    placeholder: string;
    empty: string;
    routes: string;
    orders: string;
    swaps: string;
    commands: string;
    openButton: string;
  };
  feeBanner: {
    warningTitle: string;
    criticalTitle: string;
    dismiss: string;
    snooze: string;
    guidancePrefix: string;
  };
};

const MESSAGES: Record<SupportedLocale, I18nMessages> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      swap: "Swap",
      market: "Market",
      orders: "Orders",
      htlcs: "HTLCs",
      settings: "Settings",
      protocol: "Protocol",
      explorer: "Explorer",
      about: "About",
      admin: "Admin",
    },
    commandPalette: {
      title: "Quick Actions",
      placeholder: "Search routes, orders, swaps, commands...",
      empty: "No matching actions",
      routes: "Routes",
      orders: "Orders",
      swaps: "Swaps",
      commands: "Commands",
      openButton: "Open command palette",
    },
    feeBanner: {
      warningTitle: "Elevated network fees detected",
      criticalTitle: "High congestion risk",
      dismiss: "Dismiss",
      snooze: "Snooze 30m",
      guidancePrefix: "Guidance",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      swap: "Intercambio",
      market: "Mercado",
      orders: "Ordenes",
      htlcs: "HTLCs",
      settings: "Configuracion",
      protocol: "Protocolo",
      explorer: "Explorador",
      about: "Acerca de",
      admin: "Admin",
    },
    commandPalette: {
      title: "Acciones Rapidas",
      placeholder: "Buscar rutas, ordenes, swaps, comandos...",
      empty: "Sin resultados",
      routes: "Rutas",
      orders: "Ordenes",
      swaps: "Swaps",
      commands: "Comandos",
      openButton: "Abrir paleta de comandos",
    },
    feeBanner: {
      warningTitle: "Se detectaron tarifas elevadas",
      criticalTitle: "Riesgo alto por congestion",
      dismiss: "Cerrar",
      snooze: "Posponer 30m",
      guidancePrefix: "Guia",
    },
  },
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function getMessages(locale?: string): I18nMessages {
  if (locale && isSupportedLocale(locale)) {
    return MESSAGES[locale];
  }
  return MESSAGES[DEFAULT_LOCALE];
}

export function getLocaleFromPathname(pathname: string): SupportedLocale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    return segment;
  }
  return DEFAULT_LOCALE;
}

export function stripLocaleFromPathname(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segment = normalized.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    const stripped = normalized.replace(new RegExp(`^/${segment}`), "");
    return stripped.length > 0 ? stripped : "/";
  }
  return normalized;
}

export function buildLocalizedPath(pathname: string, locale: SupportedLocale): string {
  const normalized = stripLocaleFromPathname(pathname.startsWith("/") ? pathname : `/${pathname}`);
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}
