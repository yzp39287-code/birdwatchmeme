-- 观鸟 meme 第二轮：管理与安全（增量迁移，可重复执行）
-- 不删除 memes、专题、投票或 Storage 中的任何现有记录。
-- 执行前可先在新版管理员控制台点击“导出数据备份”。

begin;

alter table public.memes add column if not exists is_hidden boolean not null default false;
alter table public.memes add column if not exists hidden_at timestamptz;
alter table public.memes add column if not exists updated_at timestamptz not null default now();
alter table public.memes add column if not exists author_name text;
alter table public.memes add column if not exists source_name text;
alter table public.memes add column if not exists source_url text;

create or replace function public.set_meme_updated_at()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  new.updated_at=now();
  if new.is_hidden and not old.is_hidden then new.hidden_at=now(); end if;
  if not new.is_hidden then new.hidden_at=null; end if;
  return new;
end $$;
drop trigger if exists set_meme_updated_at on public.memes;
create trigger set_meme_updated_at before update on public.memes
for each row execute function public.set_meme_updated_at();

alter table public.memes enable row level security;
revoke insert,update,delete on public.memes from anon;
grant select on public.memes to anon,authenticated;
grant insert,update,delete on public.memes to authenticated;
drop policy if exists "Public can read memes" on public.memes;
create policy "Public can read memes" on public.memes for select using(
  is_hidden=false or (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
);
drop policy if exists "Owner can insert memes" on public.memes;
drop policy if exists "Owner can update memes" on public.memes;
drop policy if exists "Owner can delete memes" on public.memes;
drop policy if exists "Admin can insert memes" on public.memes;
drop policy if exists "Admin can update memes" on public.memes;
drop policy if exists "Admin can delete memes" on public.memes;
create policy "Admin can insert memes" on public.memes for insert to authenticated with check(
  (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid and owner_id=(select auth.uid())
);
create policy "Admin can update memes" on public.memes for update to authenticated
using((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid)
with check((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid);
create policy "Admin can delete memes" on public.memes for delete to authenticated
using((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid);

alter table public.categories enable row level security;
revoke insert,update,delete on public.categories from anon;
grant select on public.categories to anon,authenticated;
grant insert on public.categories to authenticated;
drop policy if exists "Admin can insert categories" on public.categories;
create policy "Admin can insert categories" on public.categories for insert to authenticated with check(
  (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid and created_by=(select auth.uid())
);

alter table public.night_heron_contest_entries enable row level security;
revoke insert,update,delete on public.night_heron_contest_entries from anon;
grant select on public.night_heron_contest_entries to anon,authenticated;
grant insert,update,delete on public.night_heron_contest_entries to authenticated;
drop policy if exists "Admin can add night heron contest entries" on public.night_heron_contest_entries;
drop policy if exists "Admin can remove night heron contest entries" on public.night_heron_contest_entries;
drop policy if exists "Admin can update night heron contest entries" on public.night_heron_contest_entries;
create policy "Admin can add night heron contest entries" on public.night_heron_contest_entries
for insert to authenticated with check((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid and created_by=(select auth.uid()));
create policy "Admin can update night heron contest entries" on public.night_heron_contest_entries
for update to authenticated using((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid)
with check((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid);
create policy "Admin can remove night heron contest entries" on public.night_heron_contest_entries
for delete to authenticated using((select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid);

alter table public.night_heron_votes enable row level security;
alter table public.night_heron_votes drop constraint if exists night_heron_votes_meme_id_fkey;
alter table public.night_heron_votes add constraint night_heron_votes_meme_id_fkey foreign key(meme_id) references public.memes(id) on delete cascade;
revoke update,delete on public.night_heron_votes from anon,authenticated;
revoke insert on public.night_heron_votes from anon;
grant select,insert on public.night_heron_votes to authenticated;
drop policy if exists "Users can read own night heron votes" on public.night_heron_votes;
create policy "Users can read own night heron votes" on public.night_heron_votes for select to authenticated using(
  user_id=(select auth.uid()) or (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
);
drop policy if exists "Users get one vote per Beijing day" on public.night_heron_votes;
create policy "Users get one vote per Beijing day" on public.night_heron_votes for insert to authenticated with check(
  user_id=(select auth.uid())
  and vote_day=(timezone('Asia/Shanghai',now()))::date
  and exists(select 1 from public.night_heron_contest_entries e where e.meme_id=night_heron_votes.meme_id)
  and exists(select 1 from public.night_heron_contest_settings s where s.id=1 and s.is_open=true and (s.ends_at is null or s.ends_at>now()))
);
create unique index if not exists night_heron_one_vote_per_day on public.night_heron_votes(user_id,vote_day);

alter table public.night_heron_contest_settings enable row level security;
revoke insert,update,delete on public.night_heron_contest_settings from anon;
grant select on public.night_heron_contest_settings to anon,authenticated;
grant insert,update on public.night_heron_contest_settings to authenticated;

drop policy if exists "Owner can upload meme images" on storage.objects;
drop policy if exists "Owner can delete meme images" on storage.objects;
drop policy if exists "Admin can upload meme images" on storage.objects;
drop policy if exists "Admin can delete meme images" on storage.objects;
create policy "Admin can upload meme images" on storage.objects for insert to authenticated with check(
  bucket_id='memes' and (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
);
create policy "Admin can delete meme images" on storage.objects for delete to authenticated using(
  bucket_id='memes' and (select auth.uid())='e06f43d2-f022-43ec-87bc-9d0b36ce5b4f'::uuid
);

commit;
