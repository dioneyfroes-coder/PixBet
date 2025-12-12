import { sendApiRequest } from '../core/client';
import { resolveAuthOptions } from './_internal';

export type AuditLogEntry = {
  id?: string;
  action?: string;
  amount?: number | string | null;
  status?: string | null;
  recordedAt?: string | null;
  agent?: string | null;
  meta?: Record<string, unknown> | null;
};

export type AuditLogResponse = {
  entries: AuditLogEntry[];
  total: number;
};

export type AdminStatusSnapshot = Record<string, unknown> | null;

const normalizeEntries = (payload: unknown): AuditLogEntry[] => {
  if (!Array.isArray(payload)) return [];
  return payload.map((entry) => ({
    ...(typeof entry === 'object' && entry !== null ? entry : {}),
  })) as AuditLogEntry[];
};

export async function getStatus(): Promise<AdminStatusSnapshot> {
  const authOptions = await resolveAuthOptions();
  const { data } = await sendApiRequest<AdminStatusSnapshot>('/admin/status', {
    method: 'GET',
    token: authOptions.token,
    bypassUserId: authOptions.bypassUserId,
  });
  return data ?? null;
}

export async function getAuditLogs(
  params?: Record<string, string | number | boolean | undefined>
): Promise<AuditLogResponse> {
  const authOptions = await resolveAuthOptions();
  const { data } = await sendApiRequest<{ entries?: unknown; total?: number }>(
    '/admin/audit-logs',
    {
      method: 'GET',
      searchParams: params,
      token: authOptions.token,
      bypassUserId: authOptions.bypassUserId,
    }
  );
  const entries = normalizeEntries(data?.entries);
  const total = typeof data?.total === 'number' ? data.total : entries.length;
  return { entries, total };
}

export async function runAdminAction(
  action: string,
  payload?: Record<string, unknown>
): Promise<unknown> {
  const authOptions = await resolveAuthOptions();
  const { data } = await sendApiRequest(`/admin/actions/${action}`, {
    method: 'POST',
    body: payload,
    token: authOptions.token,
    bypassUserId: authOptions.bypassUserId,
  });
  return data;
}

export default { getStatus, getAuditLogs, runAdminAction };
