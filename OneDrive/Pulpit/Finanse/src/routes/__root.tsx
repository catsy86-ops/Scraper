import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/fiszu/ErrorBoundary";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Strona nie istnieje</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Szukana strona nie istnieje lub została przeniesiona.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[oklch(0.78_0.17_165)] to-[oklch(0.72_0.15_200)] px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Wróć na pulpit
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FISZU — Twoje finanse osobiste" },
      { name: "description", content: "FISZU — nowoczesna aplikacja do zarządzania finansami osobistymi. Śledź wydatki, oszczędzaj na opłatach i analizuj budżet." },
      { name: "author", content: "FISZU" },
      { property: "og:title", content: "FISZU — Twoje finanse osobiste" },
      { property: "og:description", content: "Zarządzaj budżetem, śledź wydatki i oszczędzaj z FISZU." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
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
  return (
    <ErrorBoundary>
      <Outlet />
      <Toaster richColors position="top-right" theme="dark" />
    </ErrorBoundary>
  );
}
