import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageShell } from '../page-shell';

vi.mock('../site-header', () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}));

vi.mock('../site-footer', () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

vi.mock('../site-sidebar', () => ({
  SiteSidebar: () => <aside data-testid="site-sidebar" />,
  SiteNavMobile: () => <nav data-testid="site-nav-mobile" />,
}));

describe('PageShell', () => {
  it('renders structural regions and supplied content', () => {
    render(
      <PageShell title="Meu painel" description="Resumo de indicadores">
        <p>conteudo principal</p>
      </PageShell>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(screen.getByTestId('site-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('site-nav-mobile')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meu painel' })).toBeInTheDocument();
    expect(screen.getByText('Resumo de indicadores')).toBeInTheDocument();
    expect(screen.getByText('conteudo principal')).toBeInTheDocument();
  });
});
