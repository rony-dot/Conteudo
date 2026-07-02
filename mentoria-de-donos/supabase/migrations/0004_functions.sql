-- ============================================================
-- Função pública para gerar a agenda sem vazar dados de reservas.
-- Retorna apenas os intervalos ocupados (sem quem reservou), para que a
-- vitrine possa esconder horários já tomados respeitando a privacidade.
-- ============================================================

create or replace function public.busy_intervals(mentor uuid)
returns table (start_at timestamptz, end_at timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select b.start_at, b.end_at
  from public.bookings b
  where b.mentor_id = mentor
    and (
      b.status in ('confirmed', 'completed')
      or (b.status = 'pending_payment' and b.hold_expires_at > now())
    );
$$;

grant execute on function public.busy_intervals(uuid) to anon, authenticated;
