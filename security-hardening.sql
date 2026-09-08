-- 观鸟meme 管理员权限安全加固
-- 仅替换权限策略，不修改、删除或清空现有数据。

drop policy if exists "Owner can insert memes" on public.memes;
drop policy if exists "Owner can update memes" on public.memes;
drop policy if exists "Owner can delete memes" on public.memes;

create policy "Admin can insert memes"
on public.memes for insert to authenticated
with check (
  (select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
  and owner_id = (select auth.uid())
);

create policy "Admin can update memes"
on public.memes for update to authenticated
using ((select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid)
with check (
  (select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
  and owner_id = (select auth.uid())
);

create policy "Admin can delete memes"
on public.memes for delete to authenticated
using ((select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid);

drop policy if exists "Owner can upload meme images" on storage.objects;
drop policy if exists "Owner can delete meme images" on storage.objects;

create policy "Admin can upload meme images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'memes'
  and (select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Admin can delete meme images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'memes'
  and (select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
  and owner_id = (select auth.uid()::text)
);
