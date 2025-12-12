import React from 'react';
import { Card, CardContent } from '../ui/card';
import { FadeIn } from '../animation';
import { useAccountStore, selectWalletBalance } from '../../stores/useAccountStore';
import { formatMoney } from '../../lib/config';

export default function AccountStats() {
  const walletBalanceCents = useAccountStore(selectWalletBalance);

  const balanceValue = walletBalanceCents == null ? '—' : formatMoney(walletBalanceCents);

  return (
    <section className="grid gap-6 md:grid-cols-1">
      <FadeIn>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-muted)]">Banca</p>
            <p className="text-2xl font-semibold">{balanceValue}</p>
          </CardContent>
        </Card>
      </FadeIn>
    </section>
  );
}
