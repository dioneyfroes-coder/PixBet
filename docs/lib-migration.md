Uso do Barrel `app/lib` (migração rápida)

Para simplificar imports e evitar caminhos longos para utilitários centrais, este projeto exporta os módulos principais a partir de um barrel em `app/lib/index.ts`.

Recomendado: importar a partir de `app/lib` em vez de caminhos diretos para submódulos.

Exemplos:

```ts
// antigo
import { WalletResponse } from '../lib/schemas/generated-schemas';
import { ApiError } from '../lib/sdk/errors';

// novo (preferido)
import { WalletResponse, ApiError } from 'app/lib';
```

Notas de migração:

- A exportação do barrel inclui: `token`, `auth`, `error`, `cn`, `schemas/generated-schemas` e os tipos/erros do novo SDK em `app/lib/sdk`.
- Testes que precisam espiar funções internas (ex.: `vi.spyOn(tokenModule, 'clearTokens')`) ainda podem importar o módulo específico (`app/lib/token`) para que o spy capture a chamada corretamente.
- Os clientes de rede agora moram em `app/lib/sdk/clients`. Importe-os diretamente (ex.: `import { getMyWallet } from 'app/lib/sdk/clients/wallet'`).
- Se você estiver usando caminhos relativos fora da pasta `app/`, prefira `import { ... } from 'app/lib'` para manter consistência.

Se quiser que eu aplique automaticamente as atualizações de import em todo o repositório em um branch separado, eu posso criar o branch e abrir um PR com as alterações.
