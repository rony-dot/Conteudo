# Mentoria de Donos

Marketplace de mentoria — **aprenda com quem já construiu**. De um lado, donos de
negócio e líderes executivos se cadastram, montam o perfil, definem
disponibilidade e preço por hora. Do outro, alunos, empreendedores e líderes
**contratam a hora de mentoria, pagam com Pix/cartão e já saem com a sessão
agendada** (com link de vídeo).

> Nome de trabalho: **Mentoria de Donos** (evolui a ideia original "manual de
> donos"). É trocável em uma linha — veja `config/brand.ts`. Alternativas:
> _Hora Mentor_, _Mentores Prime_, _Mentoraê_, _Mentorlab_.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — Postgres, Auth, RLS, Storage (avatares)
- **Mercado Pago** — Checkout Pro (Pix + cartão) + webhook
- **Jitsi Meet** — link de sala gerado por sessão (sem credencial)
- **Resend** (opcional) — e-mails de confirmação
- Deploy: **Vercel** + **Supabase Cloud**

## Funcionalidades (MVP)

- Cadastro/login (e-mail + senha ou link mágico) com papéis `mentor` / `mentee` / `admin`
- Onboarding do mentor: perfil, foto, expertise, **preço/hora**, bio, LinkedIn (link)
- **Disponibilidade semanal** recorrente (fuso de Brasília)
- Vitrine pública com busca por nome/área/cargo
- Página de perfil com **agenda de horários livres**
- Reserva → **pagamento (Pix/cartão)** → confirmação por webhook → **sessão agendada + sala Jitsi**
- Proteção contra double-booking no banco (constraint de exclusão) + hold de 15 min
- Painéis: aluno (minhas mentorias), mentor (sessões + ganhos), admin (mentores + reservas)

### Modelo de pagamento (v1)

A plataforma **recebe todo o valor** e registra o ganho líquido do mentor
(`price − taxa`, taxa padrão **15%**, veja `PLATFORM_FEE_PERCENT`). O repasse ao
mentor é feito manualmente/em lote no começo. O split automático (OAuth do
Mercado Pago por mentor) é evolução da fase 2.

## Como rodar localmente

```bash
cp .env.example .env.local   # e preencha as variáveis
npm install
npm run dev                  # http://localhost:3000
```

Sem variáveis o app sobe, mas cadastro/pagamento reais não funcionam.

## Configuração do Supabase

1. Crie um projeto em https://supabase.com.
2. Em **Project Settings → API**, copie `URL`, `anon key` e `service_role key`
   para o `.env.local`.
3. Aplique as migrations. Duas opções:
   - **SQL Editor**: cole e rode, em ordem, os arquivos de
     `supabase/migrations/` (0001 → 0005).
   - **CLI**: `supabase link` e `supabase db push`.
4. (Opcional) Rode `supabase/seed.sql` para popular mentores de exemplo.
5. Em **Authentication → URL Configuration**, adicione
   `http://localhost:3000/auth/callback` (e a URL de produção) como redirect.

### Tornar alguém admin

No SQL Editor:

```sql
update public.profiles set role = 'admin' where id = 'UUID_DO_USUARIO';
```

## Configuração do Mercado Pago

1. Crie uma aplicação em https://www.mercadopago.com.br/developers.
2. Use as **credenciais de teste** (sandbox) durante o desenvolvimento:
   `Access Token` → `MERCADOPAGO_ACCESS_TOKEN`,
   `Public Key` → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`.
3. Configure o **webhook** apontando para `SEU_SITE/api/mp/webhook`
   (evento: *Pagamentos*). Em produção use a URL pública (Vercel).
4. Teste com os [cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards)
   e Pix de teste.

> Localmente o webhook do MP precisa de uma URL pública — use `ngrok` ou similar
> apontando para a porta 3000 e configure essa URL no painel do MP.

## Limpeza de holds expirados

Reservas não pagas em 15 min devem ser canceladas para liberar o horário.
Chame `POST /api/bookings/cleanup` periodicamente:

- **Vercel Cron** (`vercel.json`):
  ```json
  { "crons": [{ "path": "/api/bookings/cleanup", "schedule": "*/10 * * * *" }] }
  ```
- ou **pg_cron** no Supabase cancelando `pending_payment` com `hold_expires_at < now()`.

## Deploy (Vercel)

1. Importe o repositório na Vercel apontando para a pasta `mentoria-de-donos/`
   (Root Directory).
2. Configure todas as variáveis do `.env.example` no painel da Vercel.
3. Atualize `NEXT_PUBLIC_SITE_URL` para a URL de produção e ajuste os redirects
   de Auth (Supabase) e o webhook (Mercado Pago).

## Estrutura

```
app/            # rotas (App Router) + API routes
components/     # componentes de UI (client/server)
config/brand.ts # marca (nome, cores, taxa)
lib/            # supabase, mercadopago, availability, jitsi, email, format
supabase/       # migrations SQL + seed
```

## Roadmap (fase 2+)

Login/importação via LinkedIn, avaliações e notas, mensagens in-app, split
automático de pagamento (OAuth Mercado Pago), integração Google Calendar,
reagendamento self-service, gravação de sessão.
