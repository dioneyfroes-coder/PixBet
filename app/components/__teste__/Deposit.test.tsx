import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Deposit from '../../components/wallet/Deposit';
import type { PixRequest } from '../../types/wallet';
import { I18nProvider } from '../../i18n/i18n-provider';

describe('Deposit component', () => {
  const depositCopy = {
    title: 'Depósito',
    description: 'Descrição',
    amountLabel: 'Valor',
    submitting: 'Enviando...',
    submit: 'Gerar QR Code',
    pendingHint: 'O saldo só é atualizado quando o backend confirma o pagamento do PIX.',
    modal: {
      title: 'Finalize o depósito',
      testingTitle: 'Função em testes',
      awaitingConfirmation:
        'Pagamento enviado ao provedor, aguardando confirmação; o saldo será atualizado assim que o Pix for compensado.',
      confirm: 'Atualizar saldo',
      confirming: 'Confirmando...',
      close: 'Fechar',
    },
  } as const;

  const defaultPixDeposit: PixRequest = {
    id: 'pix_dep_1',
    code: 'PIX-123',
    copyPasteCode: '000201...',
    amountCents: 25000,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    qrCode: null,
    status: 'pending',
  };

  type CreateDepositFnLocal = (
    amount: number,
    channel: { enabled: boolean; minAmount: number; maxAmount: number },
    options?: { pausedMessage?: string | undefined }
  ) => Promise<
    | { ok: true; payload: PixRequest; baselineCents: number | null }
    | { ok: false; reason: string; message?: string }
  >;

  let createDeposit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createDeposit = vi.fn().mockResolvedValue({ ok: true, payload: defaultPixDeposit });
  });

  it('calls createDeposit when submitting and shows modal when activeDeposit present', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLocale="pt-BR">
        <Deposit
          depositCopy={depositCopy}
          depositChannel={{ enabled: true, minAmount: 1000, maxAmount: 1500000 }}
          depositLimitLabel={undefined}
          depositStatusLabel={undefined}
          depositPausedMessage={undefined}
          createDeposit={createDeposit as unknown as CreateDepositFnLocal}
          isGenerating={false}
          depositErrorFromHook={null}
          activeDeposit={null}
          depositModalOpen={false}
          depositBaselineCents={null}
          isSyncing={false}
          closeDepositModal={() => {}}
          syncDepositStatus={() => {}}
        />
      </I18nProvider>
    );

    const submit = screen.getByRole('button', { name: 'Gerar QR Code' });
    await user.click(submit);

    await waitFor(() => expect(createDeposit).toHaveBeenCalled());
    expect(createDeposit).toHaveBeenCalledWith(
      250,
      { enabled: true, minAmount: 1000, maxAmount: 1500000 },
      { pausedMessage: undefined }
    );
  });

  it('renders modal content when activeDeposit provided', async () => {
    render(
      <I18nProvider initialLocale="pt-BR">
        <Deposit
          depositCopy={depositCopy}
          depositChannel={{ enabled: true, minAmount: 1000, maxAmount: 1500000 }}
          depositLimitLabel={undefined}
          depositStatusLabel={undefined}
          depositPausedMessage={undefined}
          createDeposit={createDeposit as unknown as CreateDepositFnLocal}
          isGenerating={false}
          depositErrorFromHook={null}
          activeDeposit={defaultPixDeposit}
          depositModalOpen={true}
          depositBaselineCents={null}
          isSyncing={false}
          closeDepositModal={() => {}}
          syncDepositStatus={() => {}}
        />
      </I18nProvider>
    );

    expect(await screen.findByText('Finalize o depósito')).toBeVisible();
    expect(screen.getByText('Função em testes')).toBeVisible();
  });
});
