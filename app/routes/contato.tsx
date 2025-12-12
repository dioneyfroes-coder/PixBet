import type { Route } from './+types/contato';
import { PageShell } from '../components/page-shell';
import { useState } from 'react';
import useRateLimiter from '../hooks/useRateLimiter';
import { env, contactRateMax, contactRateWindowMs } from '../config/env';

// Derive API path from validated environment config
const CONTACT_API_PATH = `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '')}/api/contact`;

// Rate limiter parameters can be configured via environment variables (already validated/parsed by env.ts)
const CONTACT_RATE_LIMIT = {
  maxAttempts: contactRateMax,
  windowMs: contactRateWindowMs,
} as const;

const DEFAULT_RATE_LIMITER_KEY = 'contact_form';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import type { ContactCopy } from '../types/i18n';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('contact');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function Contato() {
  const { messages } = useI18n();
  const copy: ContactCopy = messages.contact;

  return (
    <PageShell title={copy.title} description={copy.description}>
      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <section className="space-y-4">
          {copy.channels.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
                {item.label}
              </p>
              <p className="text-lg font-semibold">{item.value}</p>
            </article>
          ))}
        </section>
        <form
          className="space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <ContactForm copy={copy} />
        </form>
      </div>
    </PageShell>
  );
}

function ContactForm({ copy }: { copy: ContactCopy }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { canSubmit, retryAfterMs, recordHit } = useRateLimiter(
    DEFAULT_RATE_LIMITER_KEY,
    CONTACT_RATE_LIMIT.maxAttempts,
    CONTACT_RATE_LIMIT.windowMs
  );

  const submit = async () => {
    if (status === 'sending') return;
    if (!canSubmit) {
      setError(`Limite de envios atingido. Tente novamente em ${Math.ceil(retryAfterMs / 1000)}s.`);
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError(null);
    // record attempt
    recordHit();
    try {
      const payload = { name: name.trim(), email: email.trim(), message: message.trim() };
      if (!payload.message) {
        setError('Por favor preencha a mensagem.');
        setStatus('error');
        return;
      }

      const res = await fetch(CONTACT_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? 'Não foi possível enviar a mensagem.');
        setStatus('error');
        return;
      }

      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError('Erro de rede. Tente novamente.');
      setStatus('error');
    }
  };

  return (
    <>
      <div className="space-y-1">
        <label className="text-sm text-[var(--color-muted)]" htmlFor="nome">
          {copy.form.nameLabel}
        </label>
        <input
          id="nome"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.form.namePlaceholder}
          disabled={status === 'sending'}
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-[var(--color-muted)]" htmlFor="email">
          {copy.form.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.form.emailPlaceholder}
          disabled={status === 'sending'}
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-[var(--color-muted)]" htmlFor="mensagem">
          {copy.form.messageLabel}
        </label>
        <textarea
          id="mensagem"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={copy.form.messagePlaceholder}
          disabled={status === 'sending'}
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
        />
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={submit}
          disabled={status === 'sending'}
          className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-bg)]"
        >
          {status === 'sending' ? 'Enviando...' : copy.form.submit}
        </button>
        {status === 'sent' && (
          <p className="text-sm text-emerald-400">Mensagem enviada com sucesso.</p>
        )}
        {status === 'error' && <p className="text-sm text-rose-400">{error}</p>}
      </div>
    </>
  );
}
