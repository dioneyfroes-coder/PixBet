import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';
import PixKeyCard from '../profile/PixKeyCard';

// Mock das funções da API
const mockUpdatePixKey = vi.fn();
const mockGetPixKey = vi.fn();


vi.mock('../../lib/sdk/modules/users', () => ({
  usersApi: {
    updatePixKey: mockUpdatePixKey,
    getPixKey: mockGetPixKey,
  },
}));

function PixKeyCardWrapper({ initialValue = '' }) {
  const [pixKey, setPixKey] = useState(initialValue);
  const [pixStatus, setPixStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pixError, setPixError] = useState<string | null>(null);
  // Simula handlePixSave chamando a API mockada
  const handlePixSave = async (_e?: unknown, explicitValue?: string) => {
    setPixStatus('saving');
    try {
      const key = explicitValue !== undefined ? explicitValue : pixKey;
      await mockUpdatePixKey({ key });
      setPixStatus('saved');
      setPixError(null);
    } catch {
      setPixStatus('error');
      setPixError('Erro ao salvar');
    }
  };
  return (
    <PixKeyCard
      walletCopy={null}
      pixKey={pixKey}
      setPixKey={setPixKey}
      pixStatus={pixStatus}
      pixError={pixError}
      handlePixSave={handlePixSave}
    />
  );
}

describe('PixKeyCard E2E', () => {
  beforeEach(() => {
    mockUpdatePixKey.mockReset();
    mockGetPixKey.mockReset();
  });


  it('deve salvar uma chave Pix', async () => {
    mockGetPixKey.mockResolvedValueOnce({ key: '' });
    mockUpdatePixKey.mockResolvedValueOnce({ key: 'abc@pix.com' });
    render(<PixKeyCardWrapper initialValue="" />);
    const input = screen.getByLabelText(/chave pix/i);
    fireEvent.change(input, { target: { value: 'abc@pix.com' } });
    const btn = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(mockUpdatePixKey).toHaveBeenCalledWith({ key: 'abc@pix.com' });
    });
  });

  it('deve remover a chave Pix', async () => {
    mockGetPixKey.mockResolvedValueOnce({ key: 'abc@pix.com' });
    mockUpdatePixKey.mockResolvedValueOnce({ key: '' });
    render(<PixKeyCardWrapper initialValue="abc@pix.com" />);
    // Pode haver mais de um botão "Remover", pegar o primeiro visível
    const btns = screen.getAllByRole('button', { name: /remover/i });
    fireEvent.click(btns[0]);
    await waitFor(() => {
      expect(mockUpdatePixKey).toHaveBeenCalledWith({ key: '' });
    });
  });
});
