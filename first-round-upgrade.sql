-- 第一轮安全与体验升级（可重复执行）
-- 只新增字段/设置表并替换策略，不删除 memes、图片、专题关系或历史投票。

alter table public.memes add column if not exists is_hidden boolean not null default false;
alter table public.memes add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Public can read memes" on public.memes;
create policy "Public can read memes"
on public.memes for select
using (
  is_hidden = false
  or (select auth.uid()) = 'e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
);

create table if not exists public.night_heron_contest_settings (
  id integer primary key check (id = 1),
  is_open boolean not null default true,
  ends_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into public.night_heron_contest_settings(id,is_open)
values(1,true) on conflict(id) do nothing;
alter table public.night_heron_contest_settings enable row level security;
grant select on public.night_heron_contest_settings to anon,authenticated;
grant insert,update on public.night_heron_contest_settings to authenticated;

drop policy if exists "Public can read contest settings" on public.night_heron_contest_settings;
create policy "Public can read contest settings" on public.night_heron_contest_settings
for select using(true);
drop policy if exists "Admin can insert contest settings" on public.night_heron_contest_settings;
create policy "Admin can insert contest settings" on public.night_heron_contest_settings
for insert to authenticated with check(
 (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
 and updated_by=(select auth.uid())
);
drop policy if exists "Admin can update contest settings" on public.night_heron_contest_settings;
create policy "Admin can update contest settings" on public.night_heron_contest_settings
for update to authenticated
using((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid)
with check(updated_by=(select auth.uid()));

-- 即使有人绕过网页直接调用 API，暂停或截止后也不能继续投票。
drop policy if exists "Users get one vote per Beijing day" on public.night_heron_votes;
create policy "Users get one vote per Beijing day" on public.night_heron_votes
for insert to authenticated with check(
 user_id=(select auth.uid())
 and vote_day=(timezone('Asia/Shanghai',now()))::date
 and exists(
   select 1 from public.night_heron_contest_settings s
   where s.id=1 and s.is_open=true and (s.ends_at is null or s.ends_at>now())
 )
);

create or replace function public.night_heron_leaderboard()
returns table(meme_id uuid,contest_number integer,title text,vote_count bigint)
language sql security definer set search_path=public,pg_temp stable
as $$ select e.meme_id,e.contest_number,m.title,count(v.id)::bigint
from public.night_heron_contest_entries e join public.memes m on m.id=e.meme_id and m.is_hidden=false
left join public.night_heron_votes v on v.meme_id=e.meme_id
group by e.meme_id,e.contest_number,m.title order by count(v.id) desc,e.contest_number asc $$;
revoke all on function public.night_heron_leaderboard() from public;
grant execute on function public.night_heron_leaderboard() to anon,authenticated;
