import { memo } from 'react';
import { useI18n } from '../i18n/i18n-provider';
import { formatMessage } from '../lib/config';

function SiteFooterComponent() {
  const { t } = useI18n();
  const disclaimer = formatMessage(t('footer.disclaimer'), {
    year: String(new Date().getFullYear()),
  });

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-[var(--color-text)]">FrontBet</p>
        <p>{disclaimer}</p>
        <div className="flex gap-4">
          <a href="/sobre" className="hover:text-[var(--color-text)]">
            {t('footer.about')}
          </a>
          <a href="/contato" className="hover:text-[var(--color-text)]">
            {t('footer.contact')}
          </a>
        </div>
      </div>
    </footer>
  );
}

export const SiteFooter = memo(SiteFooterComponent);
SiteFooter.displayName = 'SiteFooter';
