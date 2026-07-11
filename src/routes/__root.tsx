import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart-context";
import { UIProvider } from "@/lib/ui-context";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuDrawer } from "@/components/MenuDrawer";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
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
      { title: "Mobili – Móveis direto da fábrica" },
      {
        name: "description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      { name: "author", content: "Mobili" },
      { property: "og:title", content: "Mobili – Móveis direto da fábrica" },
      {
        property: "og:description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mobili – Móveis direto da fábrica" },
      {
        name: "twitter:description",
        content:
          "Poltronas, Sofás e muito mais. Design sofisticado, qualidade artesanal e entrega na Baixada.",
      },
      {
        property: "og:image",
        content: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800",
      },
      {
        name: "twitter:image",
        content: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap",
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

  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <NavBar />
            <main className="flex-1">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            <Footer />
          </div>
          <WhatsAppFloat />
          <CartDrawer />
          <MenuDrawer />
          <Toaster
            position="bottom-left"
            toastOptions={{
              style: {
                background: "#2E3F32",
                color: "#F4EFE6",
                border: "1px solid rgba(197, 160, 89, 0.4)",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "13px",
              },
            }}
          />
        </CartProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}
