import React from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import ToastProvider, { useToast } from './components/ToastProvider';
import './lib/sdk/runtime';
import { BackendHealthNotifier } from './lib';
import { setErrorHandler } from './lib/error';
import { setLogoutHandler } from './lib/auth';
import { env } from './config/env';
import { readTokensFromCookies } from './lib/token';

import './app.css';
import { ThemeProvider } from './theme/theme-provider';
import { I18nProvider, useI18n } from './i18n/i18n-provider';
import { AuthProvider } from './stores/auth-context';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans antialiased">
        <I18nProvider>
          <ThemeProvider>
            <SkipLink />
            {children}
          </ThemeProvider>
        </I18nProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const tokens = readTokensFromCookies(request.headers.get('cookie'));
  return {
    auth: {
      isAuthenticated: Boolean(tokens.accessToken),
    },
  };
};

function RootApp({ loaderData }: Route.ComponentProps) {
  const initialAuthState = Boolean(loaderData?.auth?.isAuthenticated);
  return (
    <AuthProvider initialState={initialAuthState}>
      <ToastProvider>
        <ErrorHandlerRegistrar />
        <BackendHealthNotifier
          endpoint={`${env.NEXT_PUBLIC_API_BASE_URL}/health`}
          intervalMs={60000}
          enabled={env.NODE_ENV !== 'production'}
          debugShowTestToast={true}
        />
        <Outlet />
      </ToastProvider>
    </AuthProvider>
  );
}

function ErrorHandlerRegistrar() {
  const { show } = useToast();

  React.useEffect(() => {
    // ensure the logout handler defaults to built-in behavior unless app overrides
    setLogoutHandler(null);
  }, []);

  React.useEffect(() => {
    setErrorHandler(async (err) => {
      try {
        type ErrorContext = { time: string; path?: string; userId?: string };
        const ctx: ErrorContext = {
          time: new Date().toISOString(),
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        };

        // Show a simple toast to the user
        try {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          show(message, 'error');
        } catch {
          // ignore
        }

        // Try to forward to Sentry if DSN available and @sentry/react installed
        try {
          const dsn =
            import.meta.env.VITE_SENTRY_DSN ||
            import.meta.env.SENTRY_DSN ||
            (env as unknown as Record<string, string | undefined>).SENTRY_DSN;
          if (dsn) {
            try {
              const SentryModule = (await import('@sentry/react')) as unknown as {
                init: (opts: { dsn: string }) => void;
                captureException?: (e: unknown, ctx?: unknown) => void;
              };
              SentryModule.init({ dsn });
              SentryModule.captureException?.(err, { extra: ctx });
            } catch {
              // ignore if not installed
            }
          }
        } catch {
          // ignore
        }

        // Try to forward to LogRocket if available
        try {
          const lrApp =
            import.meta.env.VITE_LOGROCKET_APP ||
            import.meta.env.LOGROCKET_APP ||
            (env as unknown as Record<string, string | undefined>).LOGROCKET_APP;
          if (lrApp) {
            try {
              const LogRocketModule = (await import('logrocket')) as unknown as {
                init: (app: string) => void;
                captureException?: (e: unknown) => void;
              };
              LogRocketModule.init(lrApp);
              LogRocketModule.captureException?.(err as unknown);
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      } catch {
        // swallow errors from handler
      }
    });
  }, [show]);

  return null;
}

export default RootApp;

function SkipLink() {
  const { t } = useI18n();
  return (
    <a href="#main" className="skip-link">
      {t('common.skipToContent')}
    </a>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main id="main" className="pt-16 p-4 container mx-auto text-[var(--color-text)]">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
