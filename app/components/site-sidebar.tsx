import React, { memo, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { HoverLift } from './animation';
import { useGames } from '../hooks/useGames';
import { useI18n } from '../i18n/i18n-provider';
import { useAccountStore, selectWalletBalance } from '../stores/useAccountStore';
import {
  IconHome,
  IconGames,
  IconStore,
  IconWallet,
  IconProfile,
  IconActivity,
  IconAbout,
  IconContact,
} from './icons';

type SidebarNavItem =
  | { to: string; labelKey: string; icon?: React.ReactNode }
  | { to: string; label: string; icon?: React.ReactNode };

const baseNav: SidebarNavItem[] = [
  { labelKey: 'navigation.overview', to: '/', icon: <IconHome /> },
  { labelKey: 'navigation.gamesHub', to: '/games', icon: <IconGames /> },
  { labelKey: 'navigation.store', to: '/loja', icon: <IconStore /> },
  { labelKey: 'navigation.wallet', to: '/carteira', icon: <IconWallet /> },
  { labelKey: 'navigation.profile', to: '/perfil', icon: <IconProfile /> },
  { labelKey: 'navigation.activity', to: '/perfil/atividade', icon: <IconActivity /> },
  // Audit link removed — activity/history and contact provide user-facing audit trails
  { labelKey: 'navigation.about', to: '/sobre', icon: <IconAbout /> },
  { labelKey: 'navigation.contact', to: '/contato', icon: <IconContact /> },
];

const quickActions: Array<{ labelKey: string; to: string }> = [
  { labelKey: 'quickActions.depositPix', to: '/carteira' },
  { labelKey: 'quickActions.explorePromos', to: '/loja' },
];

function SiteSidebarComponent() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data: games } = useGames();
  const _walletBalanceCents = useAccountStore(selectWalletBalance);
  // Do not show wallet snapshot in sidebar (privacy)
  const _walletBalance = null;

  const sidebarNav: SidebarNavItem[] = useMemo(() => {
    if (!games || games.length === 0) {
      return baseNav;
    }
    const entries = games
      .filter((game) => Boolean(game.slug))
      .map<SidebarNavItem>((game) => ({
        label: [game.icon, game.name].filter(Boolean).join(' ').trim() || game.slug,
        to: `/games/${game.slug}`,
        icon: game.icon,
      }));
    return [...baseNav, ...entries];
  }, [games]);

  return (
    <aside
      className="sticky top-24 hidden w-64 flex-shrink-0 flex-col gap-6 lg:flex"
      aria-label={t('common.desktopNavAria')}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sidebar.navigationTitle')}</CardTitle>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            {t('sidebar.navigationSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {sidebarNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              prefetch="intent"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {'icon' in item && item.icon ? (
                <span aria-hidden className="mr-2 inline-flex items-center">
                  {React.isValidElement(item.icon) ? (
                    React.cloneElement(
                      item.icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
                      {
                        className: 'h-4 w-4 text-[var(--color-muted)]',
                        'aria-hidden': true,
                      } as React.SVGProps<SVGSVGElement>
                    )
                  ) : (
                    <span className="text-[var(--color-muted)]">{String(item.icon)}</span>
                  )}
                </span>
              ) : null}
              <span className="truncate">{'labelKey' in item ? t(item.labelKey) : item.label}</span>
            </NavLink>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sidebar.shortcutsTitle')}</CardTitle>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            {t('sidebar.shortcutsSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action) => (
            <HoverLift key={action.labelKey}>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => navigate(action.to)}
              >
                {t(action.labelKey)}
              </Button>
            </HoverLift>
          ))}
        </CardContent>
      </Card>
      {/* wallet snapshot removed for privacy */}
    </aside>
  );
}

function SiteNavMobileComponent() {
  const { t } = useI18n();
  const { data: games } = useGames();
  const _navigate = useNavigate();
  const _walletBalanceCents = useAccountStore(selectWalletBalance);
  // mobile: do not display wallet balance
  const _walletBalance = null;
  const sidebarNav: SidebarNavItem[] = useMemo(() => {
    if (!games || games.length === 0) return baseNav;
    const entries = games
      .filter((game) => Boolean(game.slug))
      .map<SidebarNavItem>((game) => ({
        label: [game.icon, game.name].filter(Boolean).join(' ').trim() || game.slug,
        to: `/games/${game.slug}`,
      }));
    return [...baseNav, ...entries];
  }, [games]);
  return (
    <div className="lg:hidden" aria-label={t('common.mobileNavAria')}>
      <div className="-mx-4 mb-4 overflow-x-auto border-b border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex w-max gap-2">
          {sidebarNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              prefetch="intent"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'border border-[color:var(--color-border)] text-[var(--color-muted)]'
                }`
              }
            >
              {'icon' in item && item.icon ? (
                <span aria-hidden className="mr-2 inline-flex items-center">
                  {React.isValidElement(item.icon) ? (
                    React.cloneElement(
                      item.icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
                      {
                        className: 'h-4 w-4 text-[var(--color-muted)]',
                        'aria-hidden': true,
                      } as React.SVGProps<SVGSVGElement>
                    )
                  ) : (
                    <span className="text-[var(--color-muted)]">{String(item.icon)}</span>
                  )}
                </span>
              ) : null}
              <span className="truncate">{'labelKey' in item ? t(item.labelKey) : item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      {/* mobile wallet snapshot removed for privacy */}
    </div>
  );
}

export const SiteSidebar = memo(SiteSidebarComponent);
SiteSidebar.displayName = 'SiteSidebar';

export const SiteNavMobile = memo(SiteNavMobileComponent);
SiteNavMobile.displayName = 'SiteNavMobile';
