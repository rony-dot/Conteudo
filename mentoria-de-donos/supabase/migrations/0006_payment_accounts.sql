-- ============================================================
-- Fase 2 — Split automático (Mercado Pago Marketplace)
-- Contas de recebimento dos mentores (tokens OAuth) + flag de conexão.
-- ============================================================

-- Flag segura para a UI/consultas saberem se o mentor já conectou o MP.
alter table public.profiles
  add column if not exists mp_connected boolean not null default false;

-- Tokens OAuth do vendedor (mentor). DADOS SENSÍVEIS.
-- Sem policies de acesso => só o service-role (server-side) lê/escreve.
create table if not exists public.mentor_payment_accounts (
  mentor_id     uuid primary key references public.profiles (id) on delete cascade,
  provider      text        not null default 'mercadopago',
  mp_user_id    text,
  access_token  text        not null,
  refresh_token text,
  public_key    text,
  expires_at    timestamptz,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS habilitado SEM nenhuma policy: bloqueia todo acesso via anon/authenticated.
-- Apenas o service-role (que ignora RLS) manipula esta tabela.
alter table public.mentor_payment_accounts enable row level security;
