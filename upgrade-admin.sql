-- 观鸟meme 管理功能增量升级
-- 可重复运行，不会删除或清空现有图片与数据。

drop policy if exists "Owner can update memes" on public.memes;
create policy "Owner can update memes"
on public.memes for update to authenticated
using (auth.uid() = owner_id and (auth.jwt() -> 'user_metadata' ->> 'user_name') = 'yzp39287-code')
with check (auth.uid() = owner_id and (auth.jwt() -> 'user_metadata' ->> 'user_name') = 'yzp39287-code');

drop policy if exists "Owner can delete memes" on public.memes;
create policy "Owner can delete memes"
on public.memes for delete to authenticated
using (auth.uid() = owner_id and (auth.jwt() -> 'user_metadata' ->> 'user_name') = 'yzp39287-code');

drop policy if exists "Owner can delete meme images" on storage.objects;
create policy "Owner can delete meme images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'memes'
  and owner_id = auth.uid()::text
  and (auth.jwt() -> 'user_metadata' ->> 'user_name') = 'yzp39287-code'
);
