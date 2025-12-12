import type { Route } from './+types/login';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { redirect, useLoaderData, useNavigate, Link } from 'react-router';
import { PageShell } from '../components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import { login as loginRequest } from '../lib/sdk/clients/auth';
import { setTokens, readTokensFromCookies } from '../lib/token';
import { ApiError } from '../lib';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('login');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function Login() {
  const { redirectTo } = useLoaderData<{ redirectTo: string }>();
  const navigate = useNavigate();
  const { messages } = useI18n();
  const loginCopy = messages.login;
  const formCopy = loginCopy.form;
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      const data = await loginRequest({
        email: formState.email.trim(),
        password: formState.password,
      });
      if (data?.accessToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null });
        navigate(redirectTo ?? '/perfil');
        return;
      }
      setError(formCopy.genericError);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(formCopy.invalidCredentials);
      } else {
        setError(formCopy.genericError);
      }
    } finally {
      setStatus('idle');
    }
  };

  const canSubmit = Boolean(formState.email && formState.password && status === 'idle');
  const registerHref = `/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;

  return (
    <PageShell title={loginCopy.title} description={loginCopy.description}>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{formCopy.cardTitle}</CardTitle>
            <p className="text-sm text-[var(--color-muted)]">{formCopy.cardDescription}</p>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-[var(--color-muted)]"
                >
                  {formCopy.emailLabel}
                </label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="nome@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-[var(--color-muted)]"
                >
                  {formCopy.passwordLabel}
                </label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {status === 'submitting' ? formCopy.submittingLabel : formCopy.submitLabel}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
              {formCopy.signupPrompt}{' '}
              <Link
                to={registerHref}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                {formCopy.signupLink}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/perfil';
  const tokens = readTokensFromCookies(request.headers.get('cookie'));
  if (tokens.accessToken) {
    throw redirect(redirectTo ?? '/perfil');
  }
  return { redirectTo };
}
