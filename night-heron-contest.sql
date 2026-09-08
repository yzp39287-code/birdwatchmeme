-- 夜鹭模仿大赛专题：只保存 meme 的关联关系，不修改或复制原记录。
create table if not exists public.night_heron_contest_entries (
  meme_id uuid primary key references public.memes(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.night_heron_contest_entries enable row level security;
grant select on public.night_heron_contest_entries to anon, authenticated;
grant insert, delete on public.night_heron_contest_entries to authenticated;
drop policy if exists "Public can read night heron contest" on public.night_heron_contest_entries;
create policy "Public can read night heron contest" on public.night_heron_contest_entries for select using (true);
drop policy if exists "Admin can add night heron contest entries" on public.night_heron_contest_entries;
create policy "Admin can add night heron contest entries" on public.night_heron_contest_entries for insert to authenticated
with check ((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid and created_by=(select auth.uid()));
drop policy if exists "Admin can remove night heron contest entries" on public.night_heron_contest_entries;
create policy "Admin can remove night heron contest entries" on public.night_heron_contest_entries for delete to authenticated
using ((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid);
