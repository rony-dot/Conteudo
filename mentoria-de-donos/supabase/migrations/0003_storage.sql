-- ============================================================
-- Storage: bucket público de avatares
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Leitura pública dos avatares.
create policy "avatares sao publicos"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada usuário só escreve/atualiza dentro da própria pasta (id do usuário).
create policy "usuario faz upload do proprio avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuario atualiza o proprio avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
