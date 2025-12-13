import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { useNavigate, useSearchParams, useLoaderData } from 'react-router';
import type { Route } from './+types/games';
import { PageShell } from '../components/page-shell';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import type { GamesHubCopy } from '../types/i18n';
import type { GameDescriptor } from '../types/games';
import { formatMessage } from '../lib/config';
import { loadGameRegistry } from '../data/game-registry';

const catalogFilters = ['all', 'sports', 'casino', 'forex'] as const;
type CatalogFilter = (typeof catalogFilters)[number];

type GameExperience = {
  id: string;
  icon: string;
  name: string;
  summary: string;
  highlights: string[];
  cta: string;
  href?: string;
  badge?: string;
  soon?: boolean;
};

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('gamesHub');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function GamesCatalog() {
  const { messages } = useI18n();
  const copy: GamesHubCopy = messages.gamesHub;
  const loaderData = useLoaderData() as { registry?: GameDescriptor[] } | undefined;
  const playCTA = (copy as unknown as Record<string, unknown>).playCTA as string | undefined;
  // Prefer backend registry. Do NOT fallback to i18n-provided mock sections —
  // if backend registry is empty or unavailable, show the generic coming-soon state.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const sections = useMemo(() => {
    if (loaderData?.registry && loaderData.registry.length > 0) {
      // build a single section from backend registry
      return [
        {
          id: 'catalog',
          eyebrow: copy.heroTag ?? 'Jogos',
          title: copy.heroTitle ?? 'Catálogo',
          description: copy.heroDescription ?? '',
          experiences: loaderData.registry.map((g) => ({
            id: g.id,
            icon: g.icon ?? '🎮',
            name: g.name,
            summary: g.overview ?? '',
            highlights: Array.isArray(g.highlights) ? g.highlights : [],
            cta: playCTA ?? 'Jogar',
            href: `/games/${g.slug}`,
            badge: undefined,
            soon: false,
          })),
        },
      ];
    }

    // intentionally return empty when backend registry is not available to avoid
    // showing placeholder/mock entries from translations.
    return [] as unknown as typeof copy.sections;
  }, [copy, playCTA, loaderData]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsSignature = searchParams.toString();
  const initialQuery = searchParams.get('q') ?? '';
  const initialSegment = (searchParams.get('segment') as CatalogFilter | null) ?? 'all';
  const normalizedSegment = catalogFilters.includes(initialSegment) ? initialSegment : 'all';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>(normalizedSegment);
  const deferredSearch = useDeferredValue(searchTerm);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleFilterChange = useCallback((filter: CatalogFilter) => {
    setActiveFilter(filter);
  }, []);

  useEffect(() => {
    const snapshot = new URLSearchParams(searchParamsSignature);
    const paramQuery = snapshot.get('q') ?? '';
    const paramSegment = snapshot.get('segment') as CatalogFilter | null;
    const normalizedParamSegment =
      paramSegment && catalogFilters.includes(paramSegment) ? paramSegment : 'all';

    setSearchTerm((current) => (current === paramQuery ? current : paramQuery));
    setActiveFilter((current) =>
      current === normalizedParamSegment ? current : normalizedParamSegment
    );
  }, [searchParamsSignature]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    const trimmedQuery = deferredSearch.trim();
    if (trimmedQuery) {
      nextParams.set('q', trimmedQuery);
    }
    if (activeFilter !== 'all') {
      nextParams.set('segment', activeFilter);
    }
    if (nextParams.toString() !== searchParamsSignature) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeFilter, deferredSearch, searchParamsSignature, setSearchParams]);

  const filterLabels: Record<CatalogFilter, string> = {
    all: copy.filters.all,
    sports: copy.filters.sports,
    casino: copy.filters.casino,
    forex: copy.filters.forex,
  };

  const groupedSections = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return sections.reduce<
      Array<{
        section: (typeof sections)[number];
        experiences: GameExperience[];
      }>
    >((acc, section) => {
      if (activeFilter !== 'all' && section.id !== activeFilter) {
        return acc;
      }

      const rawExperiences = (section as unknown as { experiences?: unknown }).experiences ?? [];
      const experiences = Array.isArray(rawExperiences)
        ? (rawExperiences as unknown[]).filter((experience) => {
            if (!term) return true;
            const haystack = JSON.stringify(experience).toLowerCase();
            return haystack.includes(term);
          })
        : [];

      if (experiences.length > 0) {
        acc.push({ section, experiences: experiences as GameExperience[] });
      }
      return acc;
    }, []);
  }, [activeFilter, sections, deferredSearch]);

  // If there are no sections provided by translations/backend, show a simplified placeholder
  if (sections.length === 0) {
    const fallbackMessage =
      copy.comingSoon ?? copy.heroDescription ?? 'Catálogo de jogos em breve.';
    return (
      <PageShell title={copy.heroTitle} description={copy.heroDescription} eyebrow={copy.heroTag}>
        <div className="space-y-6 p-6">
          <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
            <h2 className="text-2xl font-semibold">{copy.heroTitle}</h2>
            <p className="text-sm text-[var(--color-muted)]">{fallbackMessage}</p>
          </section>
        </div>
      </PageShell>
    );
  }

  const totalResults = groupedSections.reduce((acc, entry) => acc + entry.experiences.length, 0);
  const resultLabel = formatMessage(copy.filters.resultTemplate ?? '{count} resultados', {
    count: String(totalResults),
  });

  return (
    <PageShell title={copy.heroTitle} description={copy.heroDescription} eyebrow={copy.heroTag}>
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              id="games-search"
              label={copy.filters.searchPlaceholder}
              placeholder={copy.filters.searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="text-sm text-[var(--color-muted)]">{resultLabel}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {catalogFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                aria-pressed={activeFilter === filter}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-[color:var(--color-primary)] text-[var(--color-bg)]'
                    : 'border border-[color:var(--color-border)] text-[var(--color-muted)] hover:border-[color:var(--color-primary)]/40'
                }`}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        </section>

        {totalResults === 0 && (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
            {copy.filters.emptyState}
          </div>
        )}

        {groupedSections.map(({ section, experiences }) => (
          <section
            key={section.id}
            className="space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-6"
          >
            <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {section.eyebrow}
                </p>
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">{section.title}</h2>
                <p className="text-sm text-[var(--color-muted)]">{section.description}</p>
              </div>
              <span className="text-sm text-[var(--color-muted)]">
                {formatMessage(copy.filters.resultTemplate, { count: String(experiences.length) })}
              </span>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              {experiences.map((experience) => {
                const href = experience.href;
                return (
                  <article
                    key={`${section.id}-${experience.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase text-[var(--color-muted)]">
                          {section.eyebrow}
                        </p>
                        <h3 className="text-xl font-semibold">
                          {experience.icon} {experience.name}
                        </h3>
                      </div>
                      {experience.badge && (
                        <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                          {experience.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">{experience.summary}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                      {experience.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-[color:var(--color-border)] px-3 py-1"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    {href && !experience.soon ? (
                      <Button size="sm" onClick={() => navigate(href)}>
                        {experience.cta}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="text-[color:var(--color-muted)]"
                      >
                        {experience.soon ? copy.comingSoon : experience.cta}
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

export async function loader() {
  try {
    const registry = await loadGameRegistry();
    return { registry };
  } catch {
    return {};
  }
}
