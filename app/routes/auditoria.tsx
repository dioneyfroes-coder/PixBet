import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from './+types/auditoria';
import { PageShell } from '../components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FadeIn } from '../components/animation';
import { requireAuth } from '../utils/auth.server';
import { Button } from '../components/ui/button';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import type { AuditCopy } from '../types/i18n';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('audit');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

type AuditRow = {
  id: string;
  action: string;
  amount?: string | null;
  status?: string | null;
  recordedAt?: string | null;
  agent?: string | null;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const timestampFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function humanizeText(value: unknown) {
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

function formatAmountLabel(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = value >= 10_000 ? value / 100 : value;
    return currencyFormatter.format(normalized);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const numeric = Number(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(numeric)) {
      const normalized = numeric >= 10_000 ? numeric / 100 : numeric;
      return currencyFormatter.format(normalized);
    }
    return value;
  }
  return null;
}

function formatTimestampLabel(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return timestampFormatter.format(parsed);
}

function mapCopyEntries(entries: AuditCopy['entries']) {
  return (entries ?? []).map(
    (entry) =>
      ({
        id: entry.id,
        action: entry.action,
        amount: entry.amount ?? null,
        status: entry.status ?? null,
        recordedAt: entry.timestamp ?? null,
        agent: entry.agent ?? null,
      }) satisfies AuditRow
  );
}

function mapApiEntry(entry: Record<string, unknown>): AuditRow {
  const meta = (entry.meta as Record<string, unknown> | null) ?? undefined;
  const timestampSource =
    typeof entry.createdAt === 'string'
      ? entry.createdAt
      : typeof meta?.timestamp === 'string'
        ? meta.timestamp
        : undefined;
  const agent =
    (typeof meta?.actor === 'string' && meta.actor) ||
    (typeof meta?.user === 'string' && meta.user) ||
    (typeof entry.userId === 'string' ? entry.userId : null);

  const amount = meta
    ? formatAmountLabel(meta.amount ?? meta.total ?? meta.value ?? meta.delta)
    : null;
  const status = humanizeText(meta?.status ?? meta?.state ?? meta?.result);

  return {
    id:
      typeof entry.id === 'string' ? entry.id : `audit-${Math.random().toString(36).slice(2, 10)}`,
    action: typeof entry.action === 'string' ? entry.action : '—',
    amount,
    status,
    recordedAt: formatTimestampLabel(timestampSource),
    agent,
  };
}

export default function Auditoria() {
  const { messages } = useI18n();
  const auditCopy: AuditCopy = messages.audit;
  const fallbackEntries = useMemo(() => mapCopyEntries(auditCopy.entries), [auditCopy.entries]);
  const [rows, setRows] = useState<AuditRow[]>(fallbackEntries);
  const [hasRemoteRows, setHasRemoteRows] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRemoteRows) {
      setRows(fallbackEntries);
    }
  }, [fallbackEntries, hasRemoteRows]);

  const fetchLogs = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const { getAuditLogs } = await import('../lib/sdk/clients/admin');
        if (signal?.aborted) return;
        const payload = await getAuditLogs();
        if (signal?.aborted) return;
        const remoteEntries = Array.isArray(payload?.entries) ? payload.entries : [];
        setRows(remoteEntries.map((entry) => mapApiEntry(entry as Record<string, unknown>)));
        setHasRemoteRows(true);
      } catch {
        if (signal?.aborted) return;
        setError(auditCopy.loadError ?? 'Não foi possível carregar os logs agora.');
        if (!hasRemoteRows) {
          setRows(fallbackEntries);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [auditCopy.loadError, fallbackEntries, hasRemoteRows]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLogs(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [fetchLogs]);

  return (
    <PageShell title={auditCopy.title} description={auditCopy.description}>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{auditCopy.cardTitle}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" disabled={isLoading}>
              {auditCopy.exportCta}
            </Button>
            <Button size="sm" type="button" disabled={isLoading} onClick={() => fetchLogs()}>
              {isLoading ? (auditCopy.loading ?? auditCopy.refreshCta) : auditCopy.refreshCta}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          {isLoading && rows.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
              {auditCopy.loading ?? 'Sincronizando registros...'}
            </div>
          ) : null}
          {!isLoading && rows.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
              {auditCopy.emptyState ?? 'Nenhum registro disponível.'}
            </div>
          ) : null}
          {rows.map((registro, index) => (
            <FadeIn
              key={registro.id}
              delay={index * 0.05}
              className="grid gap-3 rounded-2xl border border-[color:var(--color-border)] p-4 md:grid-cols-[1fr,1fr,1fr,1fr,auto]"
            >
              <div>
                <p className="text-xs uppercase text-[var(--color-muted)]">
                  {auditCopy.columns.id}
                </p>
                <p className="font-semibold break-all">{registro.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-[var(--color-muted)]">
                  {auditCopy.columns.action}
                </p>
                <p className="font-semibold">{registro.action}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-[var(--color-muted)]">
                  {auditCopy.columns.amount}
                </p>
                <p>{registro.amount ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-[var(--color-muted)]">
                  {auditCopy.columns.status}
                </p>
                <span className="inline-flex min-w-[6rem] justify-center rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
                  {registro.status ?? auditCopy.columns.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-[var(--color-muted)]">
                  {auditCopy.columns.recordedAt}
                </p>
                <p className="font-semibold">{registro.recordedAt ?? '—'}</p>
                {registro.agent ? (
                  <p className="text-xs text-[var(--color-muted)]">{registro.agent}</p>
                ) : null}
              </div>
            </FadeIn>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export async function loader(args: Route.LoaderArgs) {
  await requireAuth(args);
  return {};
}
