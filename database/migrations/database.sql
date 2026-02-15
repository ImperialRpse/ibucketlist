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

-- profilesテーブルに bio カラムを追加（最大255文字程度のテキスト）
alter table public.profiles 
add column if not exists bio text;

-- 1. 新しいユーザーが作成された時に実行される関数を作る
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name' -- ここでsignUp時の名前を取り出す
  );
  return new;
end;
$$;

-- 2. auth.usersにデータが入った瞬間に上の関数を動かすトリガーを設定
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


  -- follows テーブルの作成
create table public.follows (
  follower_id uuid references auth.users not null, -- フォローする人
  following_id uuid references auth.users not null, -- フォローされる人
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 同じ人を二度フォローできないようにユニーク制約をかける
  primary key (follower_id, following_id)
);

-- RLS（セキュリティ）の設定
alter table public.follows enable row level security;

-- 1. 誰でもフォロー関係を見ることができる
create policy "Everyone can view follows" on follows for select using (true);

-- 2. ログインしていればフォローできる（自分自身としてのみ）
create policy "Users can follow others" on follows for insert 
with check (auth.uid() = follower_id);

-- 3. フォローを解除できる
create policy "Users can unfollow" on follows for delete 
using (auth.uid() = follower_id);

-- comments テーブルの作成
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.bucket_items(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS設定
alter table public.comments enable row level security;

-- 誰でもコメントを読める
create policy "Anyone can view comments" on comments for select using (true);

-- ログインしていればコメントできる
create policy "Authenticated users can comment" on comments for insert with check (auth.uid() = user_id);

-- 既存の外部キー制約を一度削除（もしあれば）
alter table public.comments drop constraint if exists comments_user_id_fkey;

-- profilesテーブルのidを参照するように制約を再作成
alter table public.comments 
add constraint comments_user_id_fkey 
foreign key (user_id) 
references public.profiles(id) 
on delete cascade;

-- profile画像用のコラムを追加
alter table public.profiles add column if not exists avatar_url text;

-- 1. 誰でも画像を見ることができるようにする（公開設定）
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. ログイン利用者は画像をアップロードできる
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 3. 自分の画像のみ更新・削除できるようにする（オプション）
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' );

-- 自分のプロフィールを更新できるポリシー（すでにある場合は不要）
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );

-- ==========================================
-- 1. テーブルの作成 (リセット用 CASCADE 付き)
-- ==========================================
DROP TABLE IF EXISTS public.dm_messages CASCADE;
DROP TABLE IF EXISTS public.dm_participants CASCADE;
DROP TABLE IF EXISTS public.dm_rooms CASCADE;

-- 部屋テーブル
CREATE TABLE public.dm_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 参加者管理テーブル
CREATE TABLE public.dm_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES public.dm_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(room_id, user_id)
);

-- メッセージテーブル
CREATE TABLE public.dm_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES public.dm_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. RLS (Row Level Security) の有効化
-- ==========================================
ALTER TABLE public.dm_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. dm_rooms のポリシー (作成と参照)
-- ==========================================
-- 【作成】認証済みユーザーなら誰でも作成可能 (WITH CHECK true で作成直後の制限を回避)
CREATE POLICY "dm_rooms_insert" 
ON public.dm_rooms FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 【参照】ログインしていれば一旦全表示 (後の participants 取得でフィルタリング)
CREATE POLICY "dm_rooms_select" 
ON public.dm_rooms FOR SELECT 
USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. dm_participants のポリシー (無限再帰を回避)
-- ==========================================
-- 【作成】認証済みユーザーなら誰でも追加可能
CREATE POLICY "dm_participants_insert" 
ON public.dm_participants FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 【参照】無限再帰を防ぐため、単純な true または auth.uid() ベースのチェック
CREATE POLICY "dm_participants_select" 
ON public.dm_participants FOR SELECT 
USING (auth.role() = 'authenticated');

-- ==========================================
-- 5. dm_messages のポリシー (メッセージの読み書き)
-- ==========================================
-- 【作成】送信者本人のみ、かつ認証済みであること
CREATE POLICY "dm_messages_insert" 
ON public.dm_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 【参照】自分が参加している部屋のメッセージのみ
CREATE POLICY "dm_messages_select" 
ON public.dm_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.dm_participants 
    WHERE dm_participants.room_id = dm_messages.room_id 
    AND dm_participants.user_id = auth.uid()
  )
);