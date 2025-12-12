# Contratos de API sugeridos para backend

Este documento descreve endpoints sugeridos (métodos, payloads e respostas) que o frontend espera para suportar funcionalidades implementadas: Loja, Usuários (notificações / PIX), Carteira (depósitos/saques) e Jogos (CoinFlip).

Observações:
- Todos os endpoints autenticados devem usar cabeçalho `Authorization: Bearer <token>` (ou outro esquema definido no projeto).
- Os exemplos usam JSON. Campos `amount` estão em unidades decimais BRL (ex: 250.00). Campos `amountCents` usados em algumas respostas são inteiros em centavos (ex: 25000).

---

## 1) Store

- GET /store/items
  - Query: `?limit=20&offset=0`
  - Response 200
    ```json
    {
      "items": [
        {
          "id": "sku_123",
          "title": "Pacote 100 fichas",
          "description": "Bônus de boas-vindas",
          "price": 9.9,
          "currency": "BRL",
          "available": true,
          "metadata": {}
        }
      ],
      "total": 1
    }
    ```
  - Empty response (items []) deve ser aceita pelo frontend e exibida como "Em breve".

---

## 2) Usuários

- GET /users/me
  - Response 200
    ```json
    {
      "id": "user_1",
      "email": "user@example.com",
      "pixKey": "user-pix@bank",
      "preferences": {"locale":"pt-BR"}
    }
    ```

- PUT /users/me/notifications
  - Body
    ```json
    {
      "email": true,
      "sms": false,
      "push": true
    }
    ```
  - Response 200: same payload (updated)

- PATCH /users/me/pix
  - Body
    ```json
    { "pixKey": "abc@pix" }
    ```
  - Response 200: updated user

- POST /users/me/password
  - Body
    ```json
    { "currentPassword": "old", "newPassword": "new" }
    ```
  - Response 200: { ok: true }

- DELETE /users/me
  - Response 204 No Content (ou 200 with confirmation object)

---

## 3) Carteira / Pagamentos

Endpoints para criar depósitos PIX e solicitar saques.

- POST /wallets/deposit
  - Body
    ```json
    {
      "amount": 250.00,
      "currency": "BRL",
      "method": "PIX"
    }
    ```
  - Response 201
    ```json
    {
      "id": "pix_req_1",
      "amount": 250.00,
      "amountCents": 25000,
      "expiresAt": "2025-12-12T12:34:56.000Z",
      "qrcode": "data:image/png;base64,...",
      "payload": "000201...",
      "status": "PENDING"
    }
    ```

  - Observações: frontend deve iniciar polling de `GET /wallets/deposit/:id` ou de `GET /wallets/summary` para verificar quando o saldo foi creditado.

- GET /wallets/deposit/:id
  - Response 200: mesma estrutura com `status` (`PENDING`|`CONFIRMED`|`FAILED`) e campos de tempo/qr.

- POST /wallets/withdraw
  - Body
    ```json
    {
      "amount": 100.00,
      "currency": "BRL",
      "method": "PIX",
      "pixKey": "user-pix@bank"
    }
    ```
  - Response 200
    ```json
    { "id": "withdraw_1", "status": "PENDING" }
    ```

---

## 4) Jogos — CoinFlip

- GET /games/coin-flip/config
  - Response 200
    ```json
    {
      "id": "coinflip",
      "enabled": true,
      "minBet": 1.00,
      "maxBet": 1000.00,
      "payoutMultiplier": 2.0,
      "currency": "BRL"
    }
    ```

- GET /games/coin-flip/history?limit=10
  - Response 200
    ```json
    { "rounds": [ { "id":"r1","choice":"HEADS","wager":10.0,"result":"WIN","outcome":"HEADS","payoutAmount":20.0,"createdAt":"..." } ] }
    ```

- GET /games/coin-flip/feed
  - Response 200: recent public rounds

- POST /games/coin-flip/play
  - Body
    ```json
    { "choice": "HEADS", "wager": 10.0 }
    ```
  - Response 200
    ```json
    {
      "round": { "id": "r2", "choice":"HEADS", "wager":10.0, "result":"PENDING|WIN|LOSE", "outcome":"HEADS|TAILS", "payoutAmount":20.0, "createdAt":"..." },
      "wallet": { "balance": 123.45 }
    }
    ```

---

## 5) Observabilidade e erros

- Respostas de erro devem usar formato consistente. Exemplo:
  ```json
  { "error": { "code": "INSUFFICIENT_FUNDS", "message": "Saldo insuficiente" } }
  ```

---

## Notas finais
- O frontend já trata falhas de integração com fallback gracioso (mensagens e UX). Ainda assim, implementar esses endpoints permitirá maior consistência.
- Se quiser, posso gerar um `openapi.yaml` baseado nessas definições para compartilhar com a equipe backend.
