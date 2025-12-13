**Tokens de Moeda**

Este documento descreve os tokens CSS usados pela componente de moeda (`coin`) do projeto. As variáveis são definidas em `app/styles/tokens.css` sob o grupo "Coin visuals" e possuem overrides por tema usando o atributo `data-theme`.

**Localização**: `app/styles/tokens.css`

**Variáveis disponíveis**:

- `--token-coin-surface-1`: Superfície principal da moeda (face).
- `--token-coin-surface-2`: Superfície secundária (sombreamento / backing).
- `--token-coin-surface-3`: Superfície terciária (detalhes / relevo).
- `--token-coin-rim`: Cor do aro / borda da moeda.
- `--token-coin-edge-dark`: Cor mais escura usada na aresta/espessura.
- `--token-coin-ridges-color`: Cor usada para as ranhuras/ranhagens da borda.
- `--token-coin-highlight`: Destaque brilhante/reflexo na superfície.

**Overrides por tema**
O arquivo já fornece exemplos de overrides para temas com o atributo `data-theme`, por exemplo:

```css
[data-theme='light'] {
  /* valores para light */
}
[data-theme='dark'] {
  /* valores para dark */
}
[data-theme='high-contrast'] {
  /* valores para alto contraste */
}
```

Esses overrides alteram as variáveis acima para que a componente respeite esquemas claros/escuros e acessibilidade.

**Exemplo de uso (CSS)**
Use as variáveis para estilizar a moeda. Exemplo simplificado:

```css
.coin {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, var(--token-coin-highlight), transparent 20%),
    linear-gradient(180deg, var(--token-coin-surface-1), var(--token-coin-surface-2));
  box-shadow: 0 6px 14px -6px var(--token-coin-edge-dark);
}
.coin__rim {
  background: var(--token-coin-rim);
}
.coin__ridges {
  background-image: linear-gradient(
    90deg,
    transparent,
    var(--token-coin-ridges-color) 40%,
    transparent
  );
  opacity: 0.6;
}
```

**Exemplo de uso (React / JSX)**
Você pode aplicar classes que usam as variáveis acima. Exemplo mínimo:

```tsx
function CoinSmall() {
  return (
    <div className="coin" role="img" aria-label="Moeda">
      <div className="coin__rim" />
      <div className="coin__face">1</div>
      <div className="coin__ridges" aria-hidden="true" />
    </div>
  );
}
```

**Como sobrescrever / criar um tema**
Para ajustar os tokens em runtime, adicione/alterar um bloco com `[data-theme="your-theme"]` no CSS global (ou ajuste via JS alterando o atributo no `document.documentElement`).

```css
[data-theme='custom-gold'] {
  --token-coin-surface-1: #fff8e6;
  --token-coin-rim: #b8860b;
  --token-coin-highlight: rgba(255, 255, 240, 0.35);
}
```

**Boas práticas**

- Prefira usar esses tokens em vez de cores hard-coded dentro de componentes.
- Use `--token-coin-*` para todas as partes visuais da moeda (face, aro, ranhuras, destaques) para garantir consistência entre temas.
- Para animações, respeite `prefers-reduced-motion` no CSS para acessibilidade.

Se quiser, eu posso também adicionar um exemplo visual no Storybook (ou uma página de demonstração em `docs/`) mostrando variações de tema da moeda.
