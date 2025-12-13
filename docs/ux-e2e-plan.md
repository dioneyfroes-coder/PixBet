# Plano inicial — Melhorias de UX e Testes E2E

Este documento descreve um plano inicial para começar melhorias de UX e a introdução de testes E2E.

Objetivos de curto prazo (rápido impacto)

- Corrigir micro-interações críticas na carteira (depósito/saque).
- Garantir acessibilidade de formulários (labels, ids, aria-\*).
- Adicionar cobertura E2E para fluxos principais: login, depósito PIX, saque PIX, upload de documentos no perfil.

Ferramenta recomendada para E2E

- Playwright (recomendado): rápido, suporta testes em múltiplos navegadores, gravação de fluxo, integração com CI.
- Alternativa: Cypress.

Sequência de trabalho (passos sugeridos)

1. Preparar ambiente local para E2E
   - Adicionar dependência `@playwright/test` (opcional, usar `npx` para testar sem instalar globalmente).
   - Criar pasta `e2e/` com exemplo de `playwright.config.ts` e testes base.

2. Escrever 3 testes E2E iniciais
   - fluxo_login.spec.ts: registrar/login, verificar navegação até dashboard
   - fluxo_deposito.spec.ts: gerar PIX e confirmar que modal aparece; simular confirmação e assert de atualização de saldo
   - fluxo_saque.spec.ts: solicitar saque sem pixKey (espera modal de cadastro), cadastrar chave, confirmar saque

3. Criar dados fixos / fixtures para backend
   - Usar MSW ou endpoints de teste controlados no backend de CI.
   - Para CI, apontar `NEXT_PUBLIC_API_BASE_URL` para uma instância de teste.

4. Integrar Playwright no CI
   - Adicionar job `e2e` que inicializa backend de teste (se aplicável), roda `npm run build` e executa `npx playwright test`.

Melhorias de UX iniciais (rápido)

- Confirmar textos e labels de CTAs (ex.: "Confirmar depósito" vs "Atualizar saldo").
- Feedback de sucesso/erro mais visível (toast + status inline).
- Evitar mudanças de layout quando modais aparecem (usar `overflow` controlado).
- Garantir foco lógico ao abrir modais (a11y: focus trap).
- Validar formatos de entrada (telefone, CPF/CNPJ) já no cliente com mensagens claras.

Checklist de entrega mínima

- [ ] Configuração básica Playwright em `e2e/`
- [ ] 3 testes E2E funcionando localmente
- [ ] Job `e2e` na CI (opcional / próxima iteração)
- [ ] Pequenas melhorias de UX aplicadas (cartão de confirmação, foco em modais, labels atualizados)

Próximo passo (posso executar agora)

- Criar a pasta `e2e/` com um `README.md` e um `playwright.config.ts` de exemplo e um teste template `e2e/example.spec.ts`.
- Ou, se preferir, apenas gerar o plano (feito) e começar implementações em pequenas PRs.

Diga qual abordagem prefere e eu inicio a implementação.
