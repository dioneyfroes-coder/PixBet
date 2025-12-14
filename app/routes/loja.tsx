import type { Route } from './+types/loja';
import { PageShell } from '../components/page-shell';
import { requireAuth } from '../utils/auth.server';
import { useLoaderData } from 'react-router';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import { getStoreItems, type StoreItem } from '../lib/sdk/clients/store';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('store');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function Loja() {
  const { messages } = useI18n();
  const storeCopy = messages.store;
  const loaderData = useLoaderData() as { items?: StoreItem[] } | undefined;
  const items = loaderData?.items ?? null;

  function formatPrice(value?: string | number) {
    if (value == null || value === '') return '-';
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric);
    } catch {
      return `R$ ${numeric.toFixed(2)}`;
    }
  }

  return (
    <PageShell title={storeCopy.title} description={storeCopy.description}>
      <section className="grid gap-6 md:grid-cols-3">
        {Array.isArray(items) && items.length > 0 ? (
          items.map((product, idx) => (
            <article
              key={product.id ?? product.name ?? idx}
              className="flex flex-col rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="mt-2 flex-1 text-[var(--color-muted)]">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
                <button
                  type="button"
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                  className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]"
                >
                  {storeCopy.addToCart}
                </button>
              </div>
            </article>
          ))
        ) : (
          <article className="col-span-1 md:col-span-3 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Em breve</h2>
            <p className="mt-2 text-[var(--color-muted)]">
              Itens da loja serão adicionados em breve. Fique de olho!
            </p>
          </article>
        )}
      </section>
    </PageShell>
  );
}

export async function loader(args: Route.LoaderArgs) {
  await requireAuth(args);
  try {
    const items = await getStoreItems();
    return { items };
  } catch {
    // If backend doesn't expose store endpoint yet, fallback to i18n content
    try {
      const { localeMessages, defaultLocale } = await import('../i18n/config');
      const messages = localeMessages[defaultLocale];
      const products = (messages?.store?.products ?? []) as
        | Array<{ id?: string; name: string; description?: string; price?: string | number }>
        | undefined;
      return { items: products ?? [] };
    } catch {
      return { items: [] };
    }
  }
}
