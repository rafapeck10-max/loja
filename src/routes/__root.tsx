import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart-context";
import { UIProvider } from "@/lib/ui-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuDrawer } from "@/components/MenuDrawer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";
import { jsonLd, seoHead } from "@/lib/seo";
import { WHATSAPP_DISPLAY } from "@/lib/constants";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gold">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            search={{}}
            className="inline-flex items-center justify-center bg-deep-green px-6 py-3 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Tente novamente ou volte à loja.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center bg-deep-green px-5 py-3 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center border border-deep-green px-5 py-3 text-xs font-bold uppercase tracking-wider text-deep-green transition-colors hover:bg-deep-green hover:text-sand"
          >
            Voltar à loja
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...seoHead(SITE_TITLE, SITE_DESCRIPTION, `${SITE_URL}/`).meta,
      { name: "author", content: "Mobi" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Mobi" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "Mobi",
            alternateName: "Mobi Móveis",
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/mobi-logo-approved.png`,
            telephone: WHATSAPP_DISPLAY,
            areaServed: {
              "@type": "City",
              name: "Nova Iguaçu",
              containedInPlace: { "@type": "State", name: "Rio de Janeiro" },
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+55-21-98432-4338",
              contactType: "customer service",
              availableLanguage: "Portuguese",
              areaServed: "Nova Iguaçu, RJ",
              url: "https://wa.me/5521984324338",
            },
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: "Mobi",
            alternateName: "Mobi Móveis",
            url: `${SITE_URL}/`,
            publisher: { "@id": `${SITE_URL}/#organization` },
            inLanguage: "pt-BR",
          },
        ],
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/mobi-icon.png", type: "image/png", sizes: "512x512" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isAdminRoute = useRouterState({ select: (state) => state.location.pathname === "/admin" });
  const isLinksRoute = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, "") === "/links",
  });

  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <CartProvider>
          <div className="store-shell flex min-h-screen flex-col">
            {!isLinksRoute && <Header />}
            <main
              id="conteudo"
              className={isAdminRoute || isLinksRoute ? "flex-1" : "flex-1 pb-20 md:pb-0"}
            >
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            {!isLinksRoute && <Footer />}
          </div>
          {!isAdminRoute && !isLinksRoute && <WhatsAppFloat />}
          <CartDrawer />
          <MenuDrawer />
          {!isAdminRoute && !isLinksRoute && <MobileBottomBar />}
          <Toaster
            position="bottom-left"
            toastOptions={{
              style: {
                background: "#2E3F32",
                color: "#F4EFE6",
                border: "1px solid rgba(197, 160, 89, 0.4)",
                fontFamily: "Manrope, sans-serif",
                fontSize: "13px",
              },
            }}
          />
        </CartProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}
