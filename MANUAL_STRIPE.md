# Manual de Configuração Stripe - Maná Finance

Este documento descreve como configurar o Stripe para o funcionamento correto das assinaturas (Mensal e Anual) com provisionamento automático.

## 1. Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão definidas no seu arquivo `.env` (local) e no painel da Vercel (produção):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 2. Configurando o Webhook
O Webhook é essencial para liberar o acesso "Pro" automaticamente após o pagamento.

1.  Acesse o Dashboard do Stripe: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2.  Clique em **"Adicionar endpoint"**.
3.  **URL do Endpoint:**
    *   Produção: `https://seu-dominio.com/api/webhooks/stripe`
    *   Teste Local (via Stripe CLI): `http://localhost:3000/api/webhooks/stripe`
4.  **Eventos para ouvir:**
    *   Selecione `checkout.session.completed`
    *   (Opcional) `invoice.payment_succeeded`
    *   (Opcional) `customer.subscription.deleted` (para cancelamentos)
5.  Clique em **"Adicionar endpoint"**.
6.  Copie o **Segredo de assinatura** (`whsec_...`) e adicione à variável `STRIPE_WEBHOOK_SECRET`.

## 3. Produtos e Preços
O sistema está configurado para criar os preços dinamicamente no checkout ("Price Data"), mas para referência, os valores são:

*   **Mensal:** R$ 29,99
*   **Anual:** R$ 299,99 (Permite parcelamento em até 10x)

## 4. Parcelamento (Installments)
**IMPORTANTE:** Para que o parcelamento funcione, você deve habilitá-lo no Dashboard do Stripe:
1.  Acesse [Configurações de Pagamento](https://dashboard.stripe.com/settings/payment_methods).
2.  Encontre a seção de **Cartões**.
3.  Verifique se **"Installments"** (Parcelamento) está Ativado.
4.  Se não estiver, ative-o. O Stripe gerencia as parcelas automaticamente.

O código já está configurado para solicitar o parcelamento no plano anual (`app/actions/stripe.ts`).

## 5. Testes
Para testar localmente:
1.  Instale o Stripe CLI.
2.  Faça login: `stripe login`
3.  Encaminhe eventos: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4.  Use o segredo de webhook fornecido pelo CLI no seu `.env`.
