import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Withdraw from '../wallet/Withdraw';
import type { WithdrawCardCopy } from '../../types/i18n';

describe('Withdraw component', () => {
  const basicCopy: WithdrawCardCopy = {
    title: 'Saque',
    description: 'Faça seu saque',
    amountLabel: 'Valor',
    pixRegisteredLabel: 'Chave PIX',
    submitting: 'Enviando...',
    submit: 'Sacar',
    missingPixNote: 'Sem chave',
    ctaRegisterPix: 'Ir para Perfil',
  };

  it('calls onSubmit when displayedPixKey present and submit pressed', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <Withdraw
        withdrawCopy={basicCopy}
        withdrawAmount={'10.00'}
        setWithdrawAmount={() => {}}
        displayedPixKey={'pix@key'}
        withdrawDisabled={false}
        isProcessingWithdraw={false}
        onOpenPixKeyModal={() => {}}
        onSubmit={onSubmit}
        withdrawNote={null}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Sacar/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows register CTA when no pix key and calls onOpenPixKeyModal', async () => {
    const onOpen = vi.fn();
    render(
      <Withdraw
        withdrawCopy={basicCopy}
        withdrawAmount={''}
        setWithdrawAmount={() => {}}
        displayedPixKey={null}
        withdrawDisabled={false}
        isProcessingWithdraw={false}
        onOpenPixKeyModal={onOpen}
        onSubmit={() => {}}
        withdrawNote={null}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Ir para Perfil/i }));
    expect(onOpen).toHaveBeenCalled();
  });
});
