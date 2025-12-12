import type { Route } from './+types/sobre';
import { PageShell } from '../components/page-shell';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('about');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function Sobre() {
  const { messages } = useI18n();
  const aboutCopy = messages.about;
  return (
    <PageShell title={aboutCopy.title} description={aboutCopy.description}>
      <section className="grid gap-6 md:grid-cols-3">
        {aboutCopy.pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{pillar.title}</h2>
            <p className="mt-2 text-[var(--color-muted)]">{pillar.description}</p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
