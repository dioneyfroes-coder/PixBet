import type { ReactNode } from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { SiteSidebar, SiteNavMobile } from './site-sidebar';

export function PageShell({
  children,
  title,
  description,
  eyebrow,
}: {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <SiteHeader />
      <main id="main" className="flex-1 px-4 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
          <SiteSidebar />
          <section className="flex-1">
            <SiteNavMobile />
            <div className="flex flex-col gap-6 rounded-3xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              {eyebrow && (
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  {eyebrow}
                </p>
              )}
              {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
              {description && (
                <p className="max-w-3xl text-lg text-[var(--color-muted)]">{description}</p>
              )}
              {children}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
