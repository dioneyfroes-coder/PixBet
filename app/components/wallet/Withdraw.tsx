import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

import type { WithdrawCardCopy } from '../../types/i18n';

type Props = {
  withdrawCopy: WithdrawCardCopy;
  withdrawAmount: string;
  setWithdrawAmount: (v: string) => void;
  displayedPixKey: string | null | undefined;
  withdrawDisabled: boolean;
  isProcessingWithdraw: boolean;
  withdrawLimitLabel?: string | null;
  withdrawNote: {
    status: 'success' | 'error';
    message: string;
    details?: Record<string, unknown> | null;
  } | null;
  onOpenPixKeyModal: () => void;
  onSubmit: (e: React.FormEvent) => void;
  withdrawStatusLabel?: string | null;
  withdrawPausedMessage?: string | null;
};

export default function Withdraw({
  withdrawCopy,
  withdrawAmount,
  setWithdrawAmount,
  displayedPixKey,
  withdrawDisabled,
  isProcessingWithdraw,
  withdrawLimitLabel,
  withdrawNote,
  onOpenPixKeyModal,
  onSubmit,
  withdrawStatusLabel,
  withdrawPausedMessage,
}: Props) {
  return (
    <Card aria-labelledby="saque-pix">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle id="saque-pix">{withdrawCopy.title}</CardTitle>
          <CardDescription>{withdrawCopy.description}</CardDescription>
        </div>
        {withdrawStatusLabel ? (
          <span
            className={`inline-flex min-w-[10rem] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
              withdrawDisabled
                ? 'bg-amber-500/10 text-amber-200'
                : 'bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {withdrawStatusLabel}
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="withdraw-value">
              {withdrawCopy.amountLabel}
            </label>
            <Input
              id="withdraw-value"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              inputMode="decimal"
              disabled={withdrawDisabled}
            />
            {withdrawLimitLabel ? (
              <p className="text-xs text-[var(--color-muted)]">{withdrawLimitLabel}</p>
            ) : null}
          </div>
          {displayedPixKey ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {withdrawCopy.pixRegisteredLabel ?? 'Chave PIX'}
                </label>
                <Input id="pix-key-registered" value={String(displayedPixKey)} disabled />
              </div>
              <Button
                type="submit"
                disabled={withdrawDisabled || isProcessingWithdraw}
                className="w-full"
              >
                {isProcessingWithdraw ? withdrawCopy.submitting : withdrawCopy.submit}
              </Button>
              <div className="mt-2 flex justify-between">
                <p className="text-xs text-[var(--color-muted)]">
                  Usando chave: <span className="font-mono">{String(displayedPixKey)}</span>
                </p>
                <Button size="sm" onClick={() => (window.location.href = '/perfil')}>
                  Alterar chave
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted)]">{withdrawCopy.missingPixNote}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onOpenPixKeyModal}>
                  {withdrawCopy.ctaRegisterPix ?? 'Ir para Perfil'}
                </Button>
              </div>
            </div>
          )}
        </form>
        {withdrawDisabled ? (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p>{withdrawPausedMessage}</p>
          </div>
        ) : null}
        {withdrawNote && (
          <>
            <p
              className={`mt-4 text-sm ${withdrawNote.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {withdrawNote.message}
            </p>
            {withdrawNote.details?.formatted &&
            typeof withdrawNote.details.formatted === 'string' ? (
              <p className="text-sm text-red-300">{String(withdrawNote.details.formatted)}</p>
            ) : null}
            {withdrawNote.details?.issues && typeof withdrawNote.details.issues === 'object' ? (
              <pre className="text-xs mt-2 whitespace-pre-wrap text-red-300">
                {JSON.stringify(withdrawNote.details.issues, null, 2)}
              </pre>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
