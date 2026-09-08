-- 观鸟meme 动态一级分区升级
-- 保留现有 memes 记录与 Storage 图片，不执行删除或清空数据。

create table if not exists public.categories (
  name text primary key
    check (name = btrim(name) and char_length(name) between 1 and 12 and name <> '全部'),
  sort_order integer not null default 100,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

insert into public.categories (name, sort_order, created_by)
values
  ('珠颈斑鸠', 1, 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'),
  ('夜鹭', 2, 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'),
  ('鸦科', 3, 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'),
  ('鸲类', 4, 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'),
  ('其他', 5, 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f')
on conflict (name) do update set sort_order = excluded.sort_order;

alter table public.categories enable row level security;
grant select on public.categories to anon, authenticated;
grant insert on public.categories to authenticated;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (true);

drop policy if exists "Admin can insert categories" on public.categories;
create policy "Admin can insert categories"
on public.categories for insert to authenticated
with check (
  (select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
  and created_by = (select auth.uid())
);

-- 移除旧的固定分区列表限制，使管理员新建的分区可用于 meme。
alter table public.memes drop constraint if exists memes_category_check;
