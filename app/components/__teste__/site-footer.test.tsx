import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { SiteFooter } from '../site-footer';
import { I18nProvider } from '../../i18n/i18n-provider';
import { LOCALE_STORAGE_KEY } from '../../i18n/config';

beforeEach(() => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'pt-BR');
});

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(LOCALE_STORAGE_KEY);
});

describe('SiteFooter', () => {
  it('shows brand, disclaimer and navigation links', () => {
    render(
      <I18nProvider initialLocale="pt-BR">
        <SiteFooter />
      </I18nProvider>
    );

    expect(screen.getByText('FrontBet')).toBeInTheDocument();
    const disclaimer = screen.getByText(/FrontBet\. Todas as probabilidades/);
    expect(disclaimer.textContent).toContain(String(new Date().getFullYear()));
    expect(screen.getByRole('link', { name: 'Sobre' })).toHaveAttribute('href', '/sobre');
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/contato');
  });
});
