-- ============================================================
-- Seed: mentores de exemplo para testar a vitrine e o agendamento.
-- Idempotente. Rode no SQL Editor do Supabase (ou `supabase db reset`).
--
-- Cria usuários "fantasma" em auth.users apenas para popular perfis de
-- demonstração. Eles não têm senha (não fazem login) — servem só de vitrine.
-- ============================================================

-- Insere usuários base (o trigger handle_new_user cria os profiles).
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana.souza@exemplo.com', now(), now(), '{"full_name":"Ana Souza","role":"mentor"}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bruno.lima@exemplo.com', now(), now(), '{"full_name":"Bruno Lima","role":"mentor"}'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carla.mendes@exemplo.com', now(), now(), '{"full_name":"Carla Mendes","role":"mentor"}'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diego.rocha@exemplo.com', now(), now(), '{"full_name":"Diego Rocha","role":"mentor"}')
on conflict (id) do nothing;

-- Atualiza os profiles criados pelo trigger com os dados de mentor.
update public.profiles set
  role = 'mentor',
  full_name = 'Ana Souza',
  slug = 'ana-souza',
  headline = 'Fundadora & CEO — SaaS B2B (saída de R$ 40M)',
  bio = 'Construí e vendi uma empresa de software B2B. Ajudo fundadores em go-to-market, vendas e captação.',
  avatar_url = 'https://i.pravatar.cc/300?img=47',
  expertise = array['Vendas B2B','Captação','Go-to-market','SaaS'],
  hourly_rate_cents = 45000,
  is_published = true
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles set
  role = 'mentor',
  full_name = 'Bruno Lima',
  slug = 'bruno-lima',
  headline = 'CFO — varejo e e-commerce (R$ 500M/ano)',
  bio = 'Executivo de finanças com 20 anos em varejo. Mentoria em gestão financeira, unit economics e expansão.',
  avatar_url = 'https://i.pravatar.cc/300?img=12',
  expertise = array['Finanças','Unit economics','Varejo','Gestão'],
  hourly_rate_cents = 60000,
  is_published = true
where id = '22222222-2222-2222-2222-222222222222';

update public.profiles set
  role = 'mentor',
  full_name = 'Carla Mendes',
  slug = 'carla-mendes',
  headline = 'Dona de agência de marketing (7 dígitos)',
  bio = 'Toco uma agência lucrativa há 10 anos. Ajudo donos de serviço a precificar, vender e montar time.',
  avatar_url = 'https://i.pravatar.cc/300?img=32',
  expertise = array['Marketing','Agência','Precificação','Time'],
  hourly_rate_cents = 35000,
  is_published = true
where id = '33333333-3333-3333-3333-333333333333';

update public.profiles set
  role = 'mentor',
  full_name = 'Diego Rocha',
  slug = 'diego-rocha',
  headline = 'CTO & cofundador — fintech',
  bio = 'Lidero tecnologia de uma fintech com milhões de usuários. Mentoria em produto, engenharia e liderança técnica.',
  avatar_url = 'https://i.pravatar.cc/300?img=68',
  expertise = array['Produto','Engenharia','Liderança','Fintech'],
  hourly_rate_cents = 55000,
  is_published = true
where id = '44444444-4444-4444-4444-444444444444';

-- Disponibilidade semanal (seg–sex). Limpa antes para ser idempotente.
delete from public.availability_rules
where mentor_id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

insert into public.availability_rules (mentor_id, weekday, start_time, end_time)
select m.id, d.weekday, '09:00'::time, '12:00'::time
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid),
  ('33333333-3333-3333-3333-333333333333'::uuid),
  ('44444444-4444-4444-4444-444444444444'::uuid)
) as m(id)
cross join (values (1),(2),(3),(4),(5)) as d(weekday);

insert into public.availability_rules (mentor_id, weekday, start_time, end_time)
select m.id, d.weekday, '14:00'::time, '17:00'::time
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid),
  ('44444444-4444-4444-4444-444444444444'::uuid)
) as m(id)
cross join (values (1),(3),(5)) as d(weekday);
