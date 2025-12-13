import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface WalletCopyPartial {
  withdrawCard?: { pixKeyLabel?: string };
  personalForm?: { savedNote?: string };
}

interface Props {
  walletCopy: WalletCopyPartial | null;
  pixKey: string | null;
  setPixKey: (v: string) => void;
  pixStatus: 'idle' | 'saving' | 'saved' | 'error';
  pixError: string | null;
  handlePixSave: (e?: React.SyntheticEvent) => Promise<void> | void;
}

export default function PixKeyCard({
  walletCopy,
  pixKey,
  setPixKey,
  pixStatus,
  pixError,
  handlePixSave,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Chave PIX para saques</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">
          Utilize uma chave PIX padrão para agilizar saques. Essa chave será usada como fallback
          quando não informar outra chave no momento do saque.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-pixkey">
              {walletCopy?.withdrawCard?.pixKeyLabel ?? 'Chave PIX'}
            </label>
            <Input
              id="profile-pixkey"
              value={pixKey ?? ''}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="email, cpf/cnpj, telefone ou chave aleatória"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handlePixSave} disabled={pixStatus === 'saving'}>
              {pixStatus === 'saving' ? 'Salvando...' : 'Salvar chave PIX'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setPixKey('');
                await handlePixSave();
              }}
            >
              Remover
            </Button>
            {pixStatus === 'saved' && (
              <span className="text-sm text-emerald-400">
                {walletCopy?.personalForm?.savedNote ?? 'Salvo'}
              </span>
            )}
            {pixStatus === 'error' && (
              <span className="text-sm text-rose-400">{pixError ?? 'Chave inválida'}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
