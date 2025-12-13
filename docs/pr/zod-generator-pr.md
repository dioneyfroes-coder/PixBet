# PR: chore(zod-generator): use z.unknown fallback + topo sort

## O que faz

- Troca fallback gerado de `z.any()` para `z.unknown()` no gerador de Zod.
- Ajusta record fallback para `z.record(z.string(), z.unknown())`.
- Adiciona coleta de referências entre schemas e ordenação topológica antes de emitir declarações, evitando ReferenceError por inicialização fora de ordem.
- Move a saída gerada para `app/lib/schemas/generated-schemas.ts`.
- Remove `eslint-disable` relacionados a `no-explicit-any` do gerador e re-gerou schemas.

## Racional

Remover `any` ajuda a ter validação mais estrita em runtime e evita propagação do tipo `any` para código dependente. A ordenação por dependência evita erros quando schemas se referenciam.

## Testes

- Rodei a suíte de testes localmente: `npm test` — Todos os testes passaram (21 arquivos, 52 testes).

## Notas de deploy

- Ao atualizar o OpenAPI (`docs da backend/openapi.json`), rode:

```bash
npm run gen:zod
npm test
```

## Checklist

- [x] Código gerado atualizado
- [x] Testes rodando localmente
- [ ] Revisão de código

---

Se preferir que eu abra este PR automaticamente no GitHub, autorize `gh` no ambiente ou me informe o token; caso contrário, o branch foi empurrado e este arquivo contém a descrição pronta para abrir o PR manualmente.
