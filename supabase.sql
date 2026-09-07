create table public.memes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 40),
  caption text not null check (char_length(caption) between 1 and 120),
  category text not null check (category in ('珠颈斑鸠','夜鹭','鸦科','鸲类','其他')),
  image_url text not null,
  storage_path text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.memes enable row level security;
create policy "Public can read memes" on public.memes for select using (true);
create policy "Owner can insert memes" on public.memes for insert to authenticated with check (
  auth.uid() = owner_id and (auth.jwt() -> 'user_metadata' ->> 'user_name') = 'yzp39287-code'
);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('memes','memes',true,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
create policy "Public can view meme images" on storage.objects for select using (bucket_id='memes');
create policy "Owner can upload meme images" on storage.objects for insert to authenticated with check (
  bucket_id='memes' and (auth.jwt() -> 'user_metadata' ->> 'user_name') = 'yzp39287-code'
);
