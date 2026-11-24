export interface AnalyticsConfig {
  ga4Id?: string;
  clarityId?: string;
  metaPixelId?: string;
}

type GtagFn = (...args: unknown[]) => void;
type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: FbqFn;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
    clarity?: ClarityFn;
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export function isValidGa4Id(value: string | undefined): boolean {
  return typeof value === "string" && /^G-[A-Z0-9]{4,20}$/.test(value.trim());
}

export function isValidClarityId(value: string | undefined): boolean {
  return typeof value === "string" && /^[a-z0-9]{6,20}$/i.test(value.trim());
}

export function isValidMetaPixelId(value: string | undefined): boolean {
  return typeof value === "string" && /^\d{8,20}$/.test(value.trim());
}

export function readAnalyticsConfig(
  env: Record<string, string | undefined> = (
    import.meta as { env?: Record<string, string | undefined> }
  ).env ?? {},
): AnalyticsConfig {
  const ga4 = env.VITE_GA4_ID?.trim();
  const clarity = env.VITE_CLARITY_ID?.trim();
  const pixel = env.VITE_META_PIXEL_ID?.trim();
  return {
    ...(isValidGa4Id(ga4) ? { ga4Id: ga4 } : {}),
    ...(isValidClarityId(clarity) ? { clarityId: clarity } : {}),
    ...(isValidMetaPixelId(pixel) ? { metaPixelId: pixel } : {}),
  };
}

export function sanitizeCepPrefix(cep: string): string {
  return String(cep ?? "")
    .replace(/\D+/g, "")
    .slice(0, 5);
}

let initialized = false;

function isAdminPath(pathname: string | undefined): boolean {
  if (!pathname) return false;
  const clean = pathname.replace(/\/$/, "");
  return clean === "/admin" || clean.startsWith("/admin/");
}

function appendScriptOnce(id: string, src: string): void {
  if (typeof document === "undefined" || document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function initAnalytics(config: AnalyticsConfig = readAnalyticsConfig()): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (isAdminPath(window.location?.pathname)) return false;
  if (!config.ga4Id && !config.clarityId && !config.metaPixelId) return false;
  if (initialized) return true;
  initialized = true;

  if (config.ga4Id) {
    window.dataLayer = window.dataLayer ?? [];
    if (!window.gtag) {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }
    appendScriptOnce(
      "mobi-ga4-script",
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4Id)}`,
    );
    window.gtag("js", new Date());
    window.gtag("config", config.ga4Id, { send_page_view: false });
  }

  if (config.clarityId) {
    if (!window.clarity) {
      const clarityQueue: ClarityFn = function clarity(...args: unknown[]) {
        (clarityQueue.q = clarityQueue.q ?? []).push(args);
      };
      window.clarity = clarityQueue;
    }
    appendScriptOnce(
      "mobi-clarity-script",
      `https://www.clarity.ms/tag/${encodeURIComponent(config.clarityId)}`,
    );
  }

  if (config.metaPixelId) {
    if (!window.fbq) {
      const fbqFn: FbqFn = function fbq(...args: unknown[]) {
        if (fbqFn.callMethod) {
          fbqFn.callMethod(...args);
        } else {
          (fbqFn.queue = fbqFn.queue ?? []).push(args);
        }
      };
      fbqFn.push = fbqFn;
      fbqFn.loaded = true;
      fbqFn.version = "2.0";
      fbqFn.queue = [];
      window.fbq = fbqFn;
      if (!window._fbq) window._fbq = fbqFn;
    }
    appendScriptOnce("mobi-meta-pixel-script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", config.metaPixelId);
  }

  return true;
}

function sendEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (isAdminPath(window.location?.pathname)) return;
  try {
    window.gtag?.("event", name, params);
    window.clarity?.("event", name);
  } catch {
    // Telemetry must never interrupt storefront interactions.
  }
}

export function trackPageView(pathname: string): void {
  if (typeof window === "undefined" || isAdminPath(pathname)) return;
  const config = readAnalyticsConfig();
  try {
    if (config.ga4Id && window.gtag) {
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
      });
    }
    if (config.metaPixelId && window.fbq) {
      window.fbq("track", "PageView");
    }
  } catch {
    // Telemetry errors stay silent.
  }
}

export function trackViewItem(item: {
  id: string;
  name: string;
  category: string;
  price: number;
}): void {
  sendEvent("view_item", {
    currency: "BRL",
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
      },
    ],
  });
  try {
    if (typeof window !== "undefined" && !isAdminPath(window.location?.pathname)) {
      window.fbq?.("track", "ViewContent", {
        content_ids: [item.id],
        content_name: item.name,
        content_category: item.category,
        value: item.price,
        currency: "BRL",
      });
    }
  } catch {
    // Telemetry errors stay silent.
  }
}

export function trackCheckCep(payload: {
  status: string;
  cep: string;
  city?: string;
  uf?: string;
}): void {
  const cepPrefix = sanitizeCepPrefix(payload.cep);
  if (!cepPrefix) return;
  sendEvent("check_cep_coverage", {
    cep_status: payload.status,
    cep_prefix: cepPrefix,
    ...(payload.city ? { city: payload.city } : {}),
    ...(payload.uf ? { state: payload.uf } : {}),
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}): void {
  const totalValue = Number((item.price * item.quantity).toFixed(2));
  sendEvent("add_to_cart", {
    currency: "BRL",
    value: totalValue,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        ...(item.category ? { item_category: item.category } : {}),
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
  try {
    if (typeof window !== "undefined" && !isAdminPath(window.location?.pathname)) {
      window.fbq?.("track", "AddToCart", {
        content_ids: [item.id],
        content_name: item.name,
        value: totalValue,
        currency: "BRL",
      });
    }
  } catch {
    // Telemetry errors stay silent.
  }
}

export function trackBeginCheckout(payload: {
  itemCount: number;
  pixTotal: number;
  cardTotal: number;
}): void {
  sendEvent("begin_checkout", {
    currency: "BRL",
    value: payload.pixTotal,
    card_total: payload.cardTotal,
    item_count: payload.itemCount,
  });
  try {
    if (typeof window !== "undefined" && !isAdminPath(window.location?.pathname)) {
      window.fbq?.("track", "InitiateCheckout", {
        num_items: payload.itemCount,
        value: payload.pixTotal,
        currency: "BRL",
      });
    }
  } catch {
    // Telemetry errors stay silent.
  }
}

export function trackOrderSubmitted(payload: {
  codigo: string;
  paymentMethod: string;
  pixTotal: number;
  cardTotal: number;
}): void {
  sendEvent("purchase", {
    transaction_id: payload.codigo,
    currency: "BRL",
    value: payload.pixTotal,
    card_total: payload.cardTotal,
    payment_type: payload.paymentMethod,
  });
  try {
    if (typeof window !== "undefined" && !isAdminPath(window.location?.pathname)) {
      window.fbq?.("track", "Purchase", {
        value: payload.pixTotal,
        currency: "BRL",
      });
    }
  } catch {
    // Telemetry errors stay silent.
  }
}

export function trackWhatsAppClick(payload: { source: string; productName?: string }): void {
  sendEvent("contact_whatsapp", {
    source: payload.source,
    ...(payload.productName ? { product_name: payload.productName } : {}),
  });
  try {
    if (typeof window !== "undefined" && !isAdminPath(window.location?.pathname)) {
      window.fbq?.("track", "Contact", {
        source: payload.source,
      });
    }
  } catch {
    // Telemetry errors stay silent.
  }
}
