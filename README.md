Projeto Frontend (Nome Temporário)

Este repositório contém a base frontend de uma plataforma modular voltada para experiências interativas em tempo real. A arquitetura foi desenhada para ser rápida, expansível e fácil de adaptar a diferentes produtos — inclusive comerciais.

Objetivos do Projeto

Fornecer uma fundação moderna usando React + Remix.

Oferecer um sistema de temas (light, dark, high-contrast) totalmente tokenizado.
```markdown
# frontBet — Frontend (resumo)

Projeto frontend React/TypeScript orientado a módulos (jogos, carteira, loja). O código está organizado para favorecer segurança, tipagem e migração gradual para um SDK de API tipado.

Principais objetivos
- Código tipado e validad o por Zod
- UX acessível e responsivo
- Isolar chamadas ao backend em `app/lib/sdk`

Rápido (como rodar)
1. Instale dependências

```bash
npm install
```

2. Copie exemplo de `.env` e ajuste `NEXT_PUBLIC_API_BASE_URL`

```bash
cp .env.example .env
```

3. Rodar em desenvolvimento

```bash
npm run dev
```

4. Executar testes unitários

```bash
npm run test
```

Variáveis de ambiente importantes
- `NEXT_PUBLIC_API_BASE_URL` — URL base do backend (ex.: `http://localhost:3000`).
- `NEXT_PUBLIC_MIN_DEPOSIT` — mínimo de depósito (em centavos). Ex.: `1000` = R$ 10,00.
- `NEXT_PUBLIC_MAX_DEPOSIT` — máximo de depósito (em centavos). Ex.: `1500000` = R$ 15.000,00.
- `NEXT_PUBLIC_MIN_WITHDRAWAL` — mínimo de saque (em centavos). Ex.: `2000` = R$ 20,00.
- `NEXT_PUBLIC_MAX_WITHDRAWAL` — máximo de saque (em centavos). Ex.: `1000000` = R$ 10.000,00.
- `NEXT_PUBLIC_CONTACT_RATE_MAX` — número máximo de envios permitidos pelo rate-limiter do formulário de contato (frontend).
- `NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS` — janela (ms) usada pelo rate-limiter do formulário de contato.

Observação: as variáveis acima são lidas e validadas por `app/config/env.ts` e exportadas como valores tipados (`minDeposit`, `maxDeposit`, `contactRateMax`, etc.). Prefira importar esses nomes em vez de acessar `process.env` diretamente.

Arquitetura e convenções
- SDK: `app/lib/sdk` (core, modules, clients) — todas as chamadas ao backend passam por aqui; os clientes usam `sendApiRequest` e validam respostas com Zod.
- Store: `app/stores/useAccountStore.ts` — Zustand central para usuário e carteira; hidrate via `initialAccountSnapshot` no loader das rotas.
- Money: todos os valores monetários enviados ao backend são inteiros em centavos. A UI converte para BRL quando necessário.

Notas de implementação recentes
- Removemos mocks de páginas principais (games, loja); agora preferimos dados reais do backend, com fallbacks mínimos para i18n quando necessário.
- `app/hooks/useRateLimiter.ts` implementa um rate-limiter cliente usado pelo formulário de contato.

Contribuição
- Abra PRs voltados para pequenos passos (typecheck + lint + tests após cada mudança).

CI / Secrets
- Defina `NEXT_PUBLIC_API_BASE_URL` como secret no CI para apontar o backend de testes.

Suporte / documentação interna
- Veja `docs/` para guias de onboarding e decisões de engenharia.
```
  - `NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS` — janela em ms para o rate limiter do formulário de contato
