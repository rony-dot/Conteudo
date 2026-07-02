-- ============================================================
-- Impede double-booking no nível do banco.
-- Duas reservas ATIVAS do mesmo mentor não podem se sobrepor no tempo.
-- (Reservas canceladas não contam. Holds expirados devem ser cancelados
--  pela rotina de limpeza /api/bookings/cleanup.)
-- ============================================================

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    mentor_id with =,
    tstzrange(start_at, end_at) with &&
  )
  where (status in ('confirmed', 'completed', 'pending_payment'));
