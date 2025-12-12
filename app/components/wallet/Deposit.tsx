import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import type { PixRequest } from '../../types/wallet';
import type { PixChannelState } from '../../services/wallet-service';
import type { DepositCardCopy, DepositModalCopy } from '../../types/i18n';
import { formatMoney, formatMessage } from '../../lib/config';

type CreateDepositFn = (
  amount: number,
  channel: PixChannelState,
  options?: { pausedMessage?: string }
) => Promise<{ ok: boolean; reason?: string; payload?: PixRequest; baselineCents?: number | null }>;

type Props = {
  depositCopy: DepositCardCopy;
  depositChannel: PixChannelState;
  depositLimitLabel?: string | null;
  depositStatusLabel?: string | null;
  depositPausedMessage?: string | null;
  createDeposit: CreateDepositFn;
  isGenerating: boolean;
  depositErrorFromHook?: string | null;
  activeDeposit?: PixRequest | null;
  depositModalOpen?: boolean;
  depositBaselineCents?: number | null;
  isSyncing?: boolean;
  closeDepositModal: () => void;
  syncDepositStatus: () => void;
};

export default function Deposit({
  depositCopy,
  depositChannel,
  depositLimitLabel,
  depositStatusLabel,
  depositPausedMessage,
  createDeposit,
  isGenerating,
  depositErrorFromHook,
  activeDeposit,
  depositModalOpen,
  depositBaselineCents,
  isSyncing,
  closeDepositModal,
  syncDepositStatus,
}: Props) {
  const [depositAmount, setDepositAmount] = useState('250,00');
  const [localError, setLocalError] = useState<string | null>(null);

  const parseAmount = useCallback((value: string) => {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : NaN;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);
      const amount = parseAmount(depositAmount);
      const result = await createDeposit(amount, depositChannel, { pausedMessage: depositPausedMessage });
      if (!result.ok) {
        const r = result.reason;
        if (r === 'min') {
          setLocalError(String(depositCopy?.errors?.depositMin ?? `Valor mínimo não atingido`));
          return;
        }
        if (r === 'max') {
          setLocalError(String(depositCopy?.errors?.depositMax ?? `Valor acima do permitido`));
          return;
        }
        setLocalError(String(depositCopy?.errors?.depositCreate ?? depositPausedMessage ?? 'Falha ao criar depósito'));
      }
    },
    [createDeposit, depositAmount, depositChannel, depositCopy, depositPausedMessage, parseAmount]
  );

  const displayError = localError ?? depositErrorFromHook ?? null;

  return (
    <>
      <Card aria-labelledby="deposito-pix">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle id="deposito-pix">{String(depositCopy.title ?? 'Depósito')}</CardTitle>
            <CardDescription>{String(depositCopy.description ?? '')}</CardDescription>
          </div>
          {depositStatusLabel ? (
            <span
              className={`inline-flex min-w-[10rem] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                depositChannel.enabled ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'
              }`}
            >
              {depositStatusLabel}
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="deposit-value">
                {String(depositCopy.amountLabel ?? 'Valor')}
              </label>
              <Input
                id="deposit-value"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                inputMode="decimal"
                disabled={!depositChannel.enabled || isGenerating}
              />
              {depositLimitLabel ? <p className="text-xs text-[var(--color-muted)]">{depositLimitLabel}</p> : null}
              {displayError && <p className="text-sm text-red-400">{displayError}</p>}
            </div>
            <Button type="submit" disabled={!depositChannel.enabled || isGenerating} className="w-full">
              {isGenerating ? String(depositCopy.submitting ?? 'Enviando...') : String(depositCopy.submit ?? 'Gerar PIX')}
            </Button>
          </form>

          {depositChannel.enabled ? null : (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              <p>{depositPausedMessage}</p>
              {depositChannel.reason ? <p className="text-xs text-amber-200">{depositChannel.reason}</p> : null}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-muted-foreground)]/5 p-3 text-sm text-[var(--color-foreground)]">
            {String(depositCopy.pendingHint ?? 'O saldo só é atualizado quando o backend confirma o pagamento do PIX.')}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(depositModalOpen && activeDeposit)}
        onClose={closeDepositModal}
        title={String(depositCopy.modal?.title ?? 'Depósito')}
        description={String(depositCopy.modal?.description ?? '')}
        footer={
          <>
            <Button type="button" onClick={syncDepositStatus} disabled={!activeDeposit || isSyncing}>
              {isSyncing ? String(depositCopy.modal?.confirming ?? 'Confirmando...') : String(depositCopy.modal?.confirm ?? 'Confirmar depósito')}
            </Button>
            <Button type="button" variant="secondary" onClick={closeDepositModal}>
              {String(depositCopy.modal?.close ?? 'Fechar')}
            </Button>
          </>
        }
      >
        {activeDeposit ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--color-muted-foreground)]/5 p-4">
              <p className="text-sm text-[var(--color-muted)]">{String(depositCopy.modal?.amountLabel ?? depositCopy.summaryLabel)}</p>
              <p className="text-2xl font-semibold text-[var(--color-foreground)]">{formatMoney(activeDeposit.amountCents)}</p>
              <p className="text-xs text-[var(--color-muted)]">{formatMessage(String(depositCopy.modal?.expiresHelper ?? depositCopy.expiresLabel ?? ''), { time: activeDeposit.expiresAt })}</p>
            </div>
            <div className="space-y-3 rounded-2xl border border-dashed border-[color:var(--color-border)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]">{String(depositCopy.modal?.testingTitle ?? 'Função em testes')}</p>
              <p className="text-sm text-[var(--color-foreground)]">{String(depositCopy.modal?.testingDescription ?? 'Estamos preparando um fluxo definitivo. Por enquanto, use o botão para confirmar o depósito manualmente.')}</p>
              <p className="text-xs text-[var(--color-muted)]">{String(depositCopy.modal?.processingHint ?? 'O crédito só aparece quando o provedor PIX confirma o pagamento no backend.')}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-50">{String(depositCopy.modal?.awaitingConfirmation ?? 'Pagamento enviado ao provedor, aguardando confirmação.')}</div>
            {depositCopy.modal?.devHelper ? <p className="text-xs text-[var(--color-muted)]">{String(depositCopy.modal.devHelper)}</p> : null}
          </div>
        ) : null}
      </Modal>

    </>
  );
}
