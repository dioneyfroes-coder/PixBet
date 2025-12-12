import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import type { Route } from './+types/perfil.atividade';
import { PageShell } from '../components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FadeIn } from '../components/animation';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { requireAuth } from '../utils/auth.server';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import { formatMessage } from '../lib/config';

type ActivityEvent = {
  id: string;
  type: string;
  typeKey: string;
  description: string;
  device?: string;
  timestamp: string;
};

type ActivityCopyEvent = {
  id: string;
  type: string;
  description: string;
  device?: string;
  timestamp: string;
};

const activityTimestampFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const activityCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

function normalizeKey(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'event';
  return value.trim().toLowerCase();
}

function humanize(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatActivityTimestamp(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return activityTimestampFormatter.format(parsed);
}

function mapSampleEvents(events: ActivityCopyEvent[] = []) {
  return (events ?? []).map(
    (event) =>
      ({
        id: event.id,
        type: event.type,
        typeKey: normalizeKey(event.type),
        description: event.description,
        device: event.device ?? undefined,
        timestamp: event.timestamp,
      }) satisfies ActivityEvent
  );
}

function mapTransactionToEvent(entry: Record<string, unknown>): ActivityEvent {
  const typeKey = normalizeKey(entry.type);
  const typeLabel =
    humanize(entry.type) ?? typeKey.replace(/(^|\s)\S/g, (match) => match.toUpperCase());

  const rawAmount =
    typeof entry.amount === 'number'
      ? entry.amount
      : typeof entry.amount === 'string'
        ? Number(entry.amount)
        : null;
  const normalizedAmount =
    rawAmount !== null && Number.isFinite(rawAmount) ? rawAmount / 100 : null;
  const amountLabel =
    normalizedAmount !== null ? activityCurrencyFormatter.format(normalizedAmount) : null;

  const description =
    (typeof entry.description === 'string' && entry.description.trim()) ||
    (typeof entry.reference === 'string' && entry.reference.trim()) ||
    [typeLabel, amountLabel].filter(Boolean).join(' · ') ||
    typeLabel;

  const channel = humanize(entry.channel) ?? undefined;
  const status = humanize(entry.status) ?? undefined;
  const reference =
    typeof entry.reference === 'string' && entry.reference.trim().length > 0
      ? entry.reference
      : null;
  const deviceParts = [channel, reference, status].filter(Boolean);
  const device = deviceParts.length > 0 ? deviceParts.join(' · ') : undefined;

  const timestampSource =
    (typeof entry.createdAt === 'string' && entry.createdAt) ||
    (typeof entry.timestamp === 'string' && entry.timestamp) ||
    new Date().toISOString();

  return {
    id:
      typeof entry.id === 'string'
        ? entry.id
        : `activity-${Math.random().toString(36).slice(2, 10)}`,
    type: typeLabel,
    typeKey,
    description,
    device,
    timestamp: formatActivityTimestamp(timestampSource),
  };
}

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('activity');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function AtividadeRecente() {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [isFiltering, startFilteringTransition] = useTransition();
  const { messages } = useI18n();
  const activityCopy = messages.activity;
  const sampleEvents = useMemo(() => mapSampleEvents(activityCopy.events), [activityCopy.events]);
  const [events, setEvents] = useState<ActivityEvent[]>(sampleEvents);
  const [hasRemoteEvents, setHasRemoteEvents] = useState(false);
  const [activeType, setActiveType] = useState<'todos' | string>('todos');
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRemoteEvents) {
      setEvents(sampleEvents);
    }
  }, [sampleEvents, hasRemoteEvents]);

  const fetchEvents = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoadingRemote(true);
      setLoadError(null);
      try {
        const { getTransactions } = await import('../lib/sdk/clients/transactions');
        if (signal?.aborted) return;
        const payload = await getTransactions({ limit: 50 });
        if (signal?.aborted) return;
        const remoteEvents = Array.isArray(payload?.transactions) ? payload.transactions : [];
        setEvents(
          remoteEvents.map((entry) => mapTransactionToEvent(entry as Record<string, unknown>))
        );
        setHasRemoteEvents(true);
      } catch {
        if (signal?.aborted) return;
        setLoadError(activityCopy.loadError ?? 'Não foi possível carregar a atividade agora.');
        if (!hasRemoteEvents) {
          setEvents(sampleEvents);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoadingRemote(false);
        }
      }
    },
    [activityCopy.loadError, hasRemoteEvents, sampleEvents]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchEvents(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [fetchEvents]);

  const typeOptions = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((event) => {
      map.set(event.typeKey, event.type);
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [events]);

  useEffect(() => {
    if (activeType === 'todos') return;
    if (!typeOptions.some((option) => option.key === activeType)) {
      setActiveType('todos');
    }
  }, [activeType, typeOptions]);

  const filteredEvents = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return events.filter((event) => {
      const matchesType = activeType === 'todos' || event.typeKey === activeType;
      if (!matchesType) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = `${event.type} ${event.description} ${event.device ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [activeType, deferredSearch, events]);

  const handleTypeChange = (type: 'todos' | string) => {
    startFilteringTransition(() => setActiveType(type));
  };

  return (
    <PageShell title={activityCopy.title} description={activityCopy.description}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{activityCopy.cardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Input
                label={activityCopy.searchLabel}
                placeholder={activityCopy.searchPlaceholder}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <div className="text-sm text-[var(--color-muted)]">
                {isFiltering
                  ? activityCopy.filtering
                  : formatMessage(activityCopy.totalTemplate, { count: filteredEvents.length })}
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={isLoadingRemote}
                onClick={() => fetchEvents()}
              >
                {isLoadingRemote
                  ? (activityCopy.loading ?? activityCopy.refreshCta)
                  : activityCopy.refreshCta}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={activeType === 'todos'}
              onClick={() => handleTypeChange('todos')}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                activeType === 'todos'
                  ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[color:var(--color-border)] text-[var(--color-muted)] hover:border-[color:var(--color-primary)]/30'
              }`}
            >
              {activityCopy.filters.todos}
            </button>
            {typeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={activeType === option.key}
                onClick={() => handleTypeChange(option.key)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  activeType === option.key
                    ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[color:var(--color-border)] text-[var(--color-muted)] hover:border-[color:var(--color-primary)]/30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {loadError ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {loadError}
            </div>
          ) : null}
          {isLoadingRemote && !loadError ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
              {activityCopy.loading ?? activityCopy.filtering}
            </div>
          ) : null}
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
              {activityCopy.emptyState}
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <FadeIn
                key={event.id}
                delay={index * 0.05}
                className="flex items-start gap-4 border-b border-[color:var(--color-border)] pb-4 last:border-b-0 last:pb-0"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" aria-hidden />
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
                    {event.type}
                  </p>
                  <p className="text-lg font-semibold">{event.description}</p>
                  <p className="text-sm text-[var(--color-muted)]">{event.device}</p>
                </div>
                <time className="text-xs text-[var(--color-muted)]">{event.timestamp}</time>
              </FadeIn>
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export async function loader(args: Route.LoaderArgs) {
  await requireAuth(args);
  return {};
}
