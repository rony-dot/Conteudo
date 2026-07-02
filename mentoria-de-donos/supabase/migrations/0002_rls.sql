-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.availability_rules    enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.bookings              enable row level security;
alter table public.payments              enable row level security;

-- Helper: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
-- Perfis de mentores publicados são visíveis para todos.
create policy "perfis publicados sao publicos"
  on public.profiles for select
  using (is_published = true and role = 'mentor');

-- Usuário vê o próprio perfil.
create policy "usuario ve o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin vê todos os perfis.
create policy "admin ve todos os perfis"
  on public.profiles for select
  using (public.is_admin());

-- Usuário atualiza o próprio perfil.
create policy "usuario atualiza o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin atualiza qualquer perfil.
create policy "admin atualiza qualquer perfil"
  on public.profiles for update
  using (public.is_admin());

-- ------------------------------------------------------------
-- availability_rules / exceptions
-- ------------------------------------------------------------
-- Leitura pública (necessária para gerar a agenda na vitrine).
create policy "disponibilidade e publica"
  on public.availability_rules for select using (true);
create policy "excecoes sao publicas"
  on public.availability_exceptions for select using (true);

-- Mentor gerencia a própria disponibilidade.
create policy "mentor gerencia disponibilidade"
  on public.availability_rules for all
  using (auth.uid() = mentor_id)
  with check (auth.uid() = mentor_id);
create policy "mentor gerencia excecoes"
  on public.availability_exceptions for all
  using (auth.uid() = mentor_id)
  with check (auth.uid() = mentor_id);

-- ------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------
-- Mentee vê as próprias reservas; mentor vê as reservas dele.
create policy "participantes veem a reserva"
  on public.bookings for select
  using (auth.uid() = mentee_id or auth.uid() = mentor_id or public.is_admin());

-- Mentee cria reserva para si (o status/valor final é validado no servidor).
create policy "mentee cria a propria reserva"
  on public.bookings for insert
  with check (auth.uid() = mentee_id);

-- Mentee/mentor podem cancelar as próprias reservas.
-- (Confirmação de pagamento é feita via service-role no webhook, que ignora RLS.)
create policy "participantes atualizam a reserva"
  on public.bookings for update
  using (auth.uid() = mentee_id or auth.uid() = mentor_id or public.is_admin());

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
-- Somente participantes da reserva (e admin) leem os pagamentos.
create policy "participantes veem pagamentos"
  on public.payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and (b.mentee_id = auth.uid() or b.mentor_id = auth.uid())
    )
  );
-- Escrita de pagamentos é exclusiva do service-role (webhook). Sem policy de
-- insert/update => nenhum cliente autenticado consegue gravar.
