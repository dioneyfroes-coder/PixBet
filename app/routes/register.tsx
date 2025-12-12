import type { Route } from './+types/register';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { redirect, useLoaderData, useNavigate, Link } from 'react-router';
import { PageShell } from '../components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import { register as registerRequest, login as loginRequest } from '../lib/sdk/clients/auth';
import { readTokensFromCookies, setTokens } from '../lib/token';
import { ApiError } from '../lib';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('register');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

type RegistrationFormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export default function Register() {
  const { redirectTo } = useLoaderData<{ redirectTo: string }>();
  const navigate = useNavigate();
  const { messages } = useI18n();
  const registerCopy = messages.register;
  const formCopy = registerCopy.form;

  const [formState, setFormState] = useState<RegistrationFormState>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    setSuccess(null);
    const payload = {
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      username: formState.username.trim(),
      email: formState.email.trim(),
      password: formState.password,
    };

    try {
      const registerResult = await registerRequest(payload);
      const shouldAttemptAutoLogin = registerResult?.user?.status === 'ACTIVE';

      if (shouldAttemptAutoLogin) {
        try {
          const auth = await loginRequest(
            { email: payload.email, password: payload.password },
            { suppressErrorHandler: true }
          );
          if (auth?.accessToken) {
            setTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken ?? null });
            navigate(redirectTo ?? '/perfil');
            return;
          }
        } catch {
          // Ignore auto-login failures; user can login manually after seeing success message.
        }
      }

      const successMessage = shouldAttemptAutoLogin
        ? formCopy.successMessage
        : (formCopy.pendingReviewMessage ?? formCopy.successMessage);
      setSuccess(successMessage);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(formCopy.conflictError);
        } else if (err.status === 400) {
          setError(formCopy.validationError ?? formCopy.genericError);
        } else {
          setError(formCopy.genericError);
        }
      } else {
        setError(formCopy.genericError);
      }
    } finally {
      setStatus('idle');
    }
  };

  const canSubmit =
    Object.values(formState).every((value) => Boolean(value.trim())) && status === 'idle';

  const handleChange =
    (key: keyof RegistrationFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((current) => ({ ...current, [key]: event.target.value }));
    };

  const loginHref = `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;

  return (
    <PageShell title={registerCopy.title} description={registerCopy.description}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{formCopy.cardTitle}</CardTitle>
            <p className="text-sm text-[var(--color-muted)]">{formCopy.cardDescription}</p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="register-first-name"
                    className="text-sm font-medium text-[var(--color-muted)]"
                  >
                    {formCopy.firstNameLabel}
                  </label>
                  <Input
                    id="register-first-name"
                    value={formState.firstName}
                    onChange={handleChange('firstName')}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="register-last-name"
                    className="text-sm font-medium text-[var(--color-muted)]"
                  >
                    {formCopy.lastNameLabel}
                  </label>
                  <Input
                    id="register-last-name"
                    value={formState.lastName}
                    onChange={handleChange('lastName')}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="register-username"
                  className="text-sm font-medium text-[var(--color-muted)]"
                >
                  {formCopy.usernameLabel}
                </label>
                <Input
                  id="register-username"
                  value={formState.username}
                  onChange={handleChange('username')}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="register-email"
                  className="text-sm font-medium text-[var(--color-muted)]"
                >
                  {formCopy.emailLabel}
                </label>
                <Input
                  id="register-email"
                  type="email"
                  value={formState.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="register-password"
                  className="text-sm font-medium text-[var(--color-muted)]"
                >
                  {formCopy.passwordLabel}
                </label>
                <Input
                  id="register-password"
                  type="password"
                  value={formState.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
                  required
                />
                {formCopy.passwordHelper ? (
                  <p className="text-xs text-[var(--color-muted)]">{formCopy.passwordHelper}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {status === 'submitting' ? formCopy.submittingLabel : formCopy.submitLabel}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
              {formCopy.loginPrompt}{' '}
              <Link
                to={loginHref}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                {formCopy.loginLink}
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
