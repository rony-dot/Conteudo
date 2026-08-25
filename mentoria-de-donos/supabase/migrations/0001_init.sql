-- ============================================================
-- Mentoria de Donos — schema inicial
-- ============================================================

-- Papéis de usuário
create type user_role as enum ('mentor', 'mentee', 'admin');

-- Status de reserva
create type booking_status as enum (
  'pending_payment',
  'confirmed',
  'cancelled',
  'completed'
);

-- ------------------------------------------------------------
-- profiles: 1:1 com auth.users
-- ------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              user_role   not null default 'mentee',
  full_name         text        not null default '',
  slug              text        unique,
  headline          text,
  bio               text,
  avatar_url        text,
  linkedin_url      text,
  expertise         text[]      not null default '{}',
  hourly_rate_cents integer,
  currency          text        not null default 'BRL',
  timezone          text        not null default 'America/Sao_Paulo',
  is_published      boolean     not null default false,
  created_at        timestamptz not null default now()
);

create index profiles_role_published_idx
  on public.profiles (role, is_published);

-- ------------------------------------------------------------
-- availability_rules: disponibilidade semanal recorrente
-- ------------------------------------------------------------
create table public.availability_rules (
  id         uuid primary key default gen_random_uuid(),
  mentor_id  uuid not null references public.profiles (id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6), -- 0=dom..6=sáb
  start_time time not null,
  end_time   time not null,
  check (end_time > start_time)
);

create index availability_rules_mentor_idx
  on public.availability_rules (mentor_id);

-- ------------------------------------------------------------
-- availability_exceptions: datas bloqueadas (folgas)
-- ------------------------------------------------------------
create table public.availability_exceptions (
  id         uuid primary key default gen_random_uuid(),
  mentor_id  uuid not null references public.profiles (id) on delete cascade,
  date       date not null,
  is_blocked boolean not null default true,
  unique (mentor_id, date)
);

-- ------------------------------------------------------------
-- bookings: reservas de sessão
-- ------------------------------------------------------------
create table public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  mentor_id          uuid not null references public.profiles (id) on delete restrict,
  mentee_id          uuid not null references public.profiles (id) on delete restrict,
  start_at           timestamptz not null,
  end_at             timestamptz not null,
  duration_min       integer not null default 60,
  price_cents        integer not null,
  platform_fee_cents integer not null default 0,
  status             booking_status not null default 'pending_payment',
  meeting_url        text,
  mp_payment_id      text,
  hold_expires_at    timestamptz,
  created_at         timestamptz not null default now(),
  check (end_at > start_at)
);

create index bookings_mentor_idx on public.bookings (mentor_id, start_at);
create index bookings_mentee_idx on public.bookings (mentee_id, start_at);

-- ------------------------------------------------------------
-- payments: registro de pagamentos
-- ------------------------------------------------------------
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.bookings (id) on delete cascade,
  provider            text not null default 'mercadopago',
  provider_payment_id text,
  amount_cents        integer not null,
  status              text not null,
  raw                 jsonb,
  created_at          timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);

-- ------------------------------------------------------------
-- Trigger: cria profile automaticamente ao criar usuário
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'mentee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
