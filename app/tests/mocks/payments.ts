import { http } from 'msw';
import { setupServer } from 'msw/node';

type WithdrawResolver = Parameters<typeof http.post>[1];

const withdrawHandler: WithdrawResolver = async ({ request }) => {
  const body = await request.json();
  const { pixKey, password } = body as Record<string, unknown>;

  // Basic validation mirrors frontend expectations
  if (!pixKey || typeof pixKey !== 'string' || (pixKey as string).length < 5) {
    return new Response(
      JSON.stringify({ formErrors: [], fieldErrors: { pixKey: ['Chave PIX inválida'] } }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Simulate password failure when password equals the literal 'wrong'
  if (password === 'wrong') {
    return new Response(JSON.stringify({ success: false, message: 'Senha incorreta' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Successful withdraw — respond with an API envelope that matches WalletOperationResponseSchema
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        wallet: {
          userId: 'user-test',
          balance: { amount: 1000, currency: 'BRL' },
        },
        message: 'Saque solicitado',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
const handlers = [http.post('*/wallets/withdraw', withdrawHandler)];

export const server = setupServer(...handlers);
