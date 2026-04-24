export const SUPPORTED_LOCALES = ["en", "es", "zh", "ja", "ar"] as const;

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
  zh: {
    nav: {
      dashboard: "仪表盘",
      swap: "兑换",
      market: "市场",
      orders: "订单",
      htlcs: "HTLC",
      settings: "设置",
      protocol: "协议",
      explorer: "浏览器",
      about: "关于",
      admin: "管理",
    },
    commandPalette: {
      title: "快捷操作",
      placeholder: "搜索路由、订单、交换、命令...",
      empty: "没有匹配结果",
      routes: "路由",
      orders: "订单",
      swaps: "交换",
      commands: "命令",
      openButton: "打开命令面板",
    },
    feeBanner: {
      warningTitle: "检测到较高网络费用",
      criticalTitle: "高拥堵风险",
      dismiss: "关闭",
      snooze: "稍后 30 分钟",
      guidancePrefix: "建议",
    },
  },
  ja: {
    nav: {
      dashboard: "ダッシュボード",
      swap: "スワップ",
      market: "マーケット",
      orders: "注文",
      htlcs: "HTLC",
      settings: "設定",
      protocol: "プロトコル",
      explorer: "エクスプローラー",
      about: "概要",
      admin: "管理",
    },
    commandPalette: {
      title: "クイックアクション",
      placeholder: "ルート、注文、スワップ、コマンドを検索...",
      empty: "一致する項目がありません",
      routes: "ルート",
      orders: "注文",
      swaps: "スワップ",
      commands: "コマンド",
      openButton: "コマンドパレットを開く",
    },
    feeBanner: {
      warningTitle: "ネットワーク手数料が上昇しています",
      criticalTitle: "高い混雑リスク",
      dismiss: "閉じる",
      snooze: "30分後に通知",
      guidancePrefix: "ガイダンス",
    },
  },
  ar: {
    nav: {
      dashboard: "لوحة التحكم",
      swap: "مبادلة",
      market: "السوق",
      orders: "الطلبات",
      htlcs: "HTLC",
      settings: "الإعدادات",
      protocol: "البروتوكول",
      explorer: "المستكشف",
      about: "حول",
      admin: "الإدارة",
    },
    commandPalette: {
      title: "إجراءات سريعة",
      placeholder: "ابحث عن المسارات والطلبات والمبادلات والأوامر...",
      empty: "لا توجد نتائج مطابقة",
      routes: "المسارات",
      orders: "الطلبات",
      swaps: "المبادلات",
      commands: "الأوامر",
      openButton: "فتح لوحة الأوامر",
    },
    feeBanner: {
      warningTitle: "تم رصد ارتفاع في رسوم الشبكة",
      criticalTitle: "مخاطر ازدحام مرتفعة",
      dismiss: "إغلاق",
      snooze: "تأجيل 30 دقيقة",
      guidancePrefix: "إرشاد",
    },
  },
};

export const RTL_LOCALES: SupportedLocale[] = ["ar"];

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
