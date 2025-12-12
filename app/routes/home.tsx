import type { Route } from './+types/home';
import { useLoaderData, useNavigate } from 'react-router';
import { useMemo } from 'react';
import { PageShell } from '../components/page-shell';
import { FadeIn, HoverLift, SlideUp } from '../components/animation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useGames } from '../hooks/useGames';
import { useI18n } from '../i18n/i18n-provider';
import { getPageMeta } from '../i18n/page-copy';
import { requireAuth } from '../utils/auth.server';
import { useAccountHydration } from '../hooks/useAccountHydration';
import {
  selectUserDisplayName,
  selectWalletBalance,
  useAccountStore,
} from '../stores/useAccountStore';
import { useAuthState } from '../stores/auth-context';
import { formatMoney } from '../lib/config';
import type { AccountHydrationPayload } from '../stores/useAccountStore';

interface Highlight {
  confrontation?: string;
  odd?: string;
}

interface ActivityItem {
  id?: string;
  time?: string;
  action?: string;
  detail?: string;
}

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('home');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export async function loader(args: Route.LoaderArgs) {
  const { accessToken } = await requireAuth(args);
  try {
    const [{ getMyWallet }, { me }] = await Promise.all([
      import('../lib/sdk/clients/wallet'),
      import('../lib/sdk/clients/auth'),
    ]);
    const [wallet, user] = await Promise.all([getMyWallet({ accessToken }), me({ accessToken })]);
    return {
      initialAccountSnapshot: {
        wallet,
        user,
        syncedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { initialAccountSnapshot: null };
  }
}

export default function Home() {
  const { initialAccountSnapshot } = useLoaderData<{
    initialAccountSnapshot: AccountHydrationPayload | null;
  }>();
  useAccountHydration(initialAccountSnapshot);
  const navigate = useNavigate();
  const { messages } = useI18n();
  const homeCopy = messages.home;
  const { data: remoteGames } = useGames();
  const displayName = useAccountStore(selectUserDisplayName);
  const _walletBalanceCents = useAccountStore(selectWalletBalance);
  const heroDescription = useMemo(() => {
    if (!displayName || !homeCopy.welcomeBack) {
      return homeCopy.heroDescription;
    }
    return `${homeCopy.heroDescription} ${homeCopy.welcomeBack.replace('{name}', displayName)}`.trim();
  }, [displayName, homeCopy.heroDescription, homeCopy.welcomeBack]);
  const _walletBalance = _walletBalanceCents == null ? null : formatMoney(_walletBalanceCents);

  const merged = homeCopy;

  return (
    <PageShell
      title={merged.meta?.title ?? homeCopy.meta.title}
      description={merged.meta?.description ?? homeCopy.meta.description}
    >
      <Card className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)]">
        <CardContent className="grid gap-8 p-8 md:grid-cols-2 md:items-center">
          <FadeIn className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {homeCopy.seasonTag}
            </p>
            <h1 className="text-4xl font-bold tracking-tight">{homeCopy.heroTitle}</h1>
            <p className="text-lg text-[var(--color-muted)]">{heroDescription}</p>
            <div className="flex flex-wrap gap-3">
              <HoverLift>
                <Button size="lg" onClick={() => navigate('/games')}>
                  {merged.primaryCta}
                </Button>
              </HoverLift>
              {/** hide secondary CTA when authenticated */}
              {!useAuthState().isAuthenticated ? (
                <HoverLift>
                  <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                    {merged.secondaryCta}
                  </Button>
                </HoverLift>
              ) : null}
            </div>
          </FadeIn>
          <SlideUp>
            <Card className="border-[color:var(--color-border)] bg-[var(--color-surface)]">
              <CardContent className="p-6">
                <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
                  {homeCopy.highlightsTitle}
                </p>
                <ul className="mt-4 space-y-4">
                  {(homeCopy.highlightsMatches ?? []).map((match: Highlight) => (
                    <li key={match.confrontation} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{match.confrontation}</p>
                        <p className="text-sm text-[var(--color-muted)]">
                          {merged.highlightsSubtitle}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--color-primary)]/10 px-4 py-2 font-semibold text-[var(--color-primary)]">
                        {match.odd}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </SlideUp>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>{homeCopy.activity.title}</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">{homeCopy.activity.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(homeCopy.activity?.items ?? []).map((item: ActivityItem) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-4 md:grid-cols-[auto,1fr]"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    {item.time}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{item.action}</p>
                    <p className="text-sm text-[var(--color-muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>{homeCopy.recommendations.title}</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">
                {homeCopy.recommendations.subtitle}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(remoteGames ?? []).slice(0, 3).map((game) => (
                <div
                  key={game.id}
                  className="flex flex-col gap-2 rounded-2xl border border-[color:var(--color-border)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase text-[var(--color-muted)]">{game.category}</p>
                      <h3 className="text-lg font-semibold">
                        {game.icon} {game.name}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/games/${game.slug}`)}
                    >
                      {homeCopy.recommendations.openCta}
                    </Button>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{game.overview}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
      {/* Wallet summary removed from Home to avoid showing balance on the landing page */}
    </PageShell>
  );
}
