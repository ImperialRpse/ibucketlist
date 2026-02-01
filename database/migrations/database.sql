-- バケットリストのテーブル作成
create table bucket_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- セキュリティ設定（作成者本人だけが編集できるようにする）
alter table bucket_items enable row level security;
create policy "Users can control their own items" on bucket_items
  for all using (auth.uid() = user_id);

-- プロフィール用のテーブルを作成
create table profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  updated_at timestamp with time zone
);

-- RLS（セキュリティ）設定：誰でも見れるが、変更は自分だけ
alter table profiles enable row level security;
create policy "誰でもプロフィールを見れる" on profiles for select using (true);
create policy "自分のプロフィールだけ更新できる" on profiles for update using (auth.uid() = id);
create policy "自分のプロフィールだけ作成できる" on profiles for insert with check (auth.uid() = id);

-- likesテーブルを作成
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  item_id uuid references public.bucket_items not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 同じ人が同じ投稿に2回いいねできないように制約を追加
  unique(user_id, item_id)
);

-- RLS設定
alter table public.likes enable row level security;
create policy "誰でもいいねの数を見れる" on public.likes for select using (true);
create policy "ログインしていればいいねできる" on public.likes for insert with check (auth.uid() = user_id);
create policy "自分のいいねを消せる" on public.likes for delete using (auth.uid() = user_id);

-- bucket_itemsテーブルにカラムを追加
alter table public.bucket_items 
add column if not exists is_completed boolean default false,
add column if not exists image_url text,
add column if not exists reflection text;

-- bucket_photosバケットへのアクセス許可
-- 1. 誰でもファイルを見れるようにする
create policy "誰でも写真を見れる" on storage.objects for select using (bucket_id = 'bucket_photos');

-- 2. ログインユーザーなら誰でもアップロードできる（認証済みユーザーのみ）
create policy "ログインしていればアップロードできる" on storage.objects for insert with check (
  bucket_id = 'bucket_photos' AND auth.role() = 'authenticated'
);