-- ============================================================
-- notifications テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid    DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id     uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- 受け取る側
  actor_id    uuid    REFERENCES public.profiles(id) ON DELETE CASCADE,           -- 送った側
  type        text    NOT NULL,   -- 'like' | 'comment' | 'reply' | 'follow' | 'dm'
  item_id     uuid    REFERENCES public.bucket_items(id) ON DELETE CASCADE,       -- 関連投稿（DM・follow は null）
  is_read     boolean DEFAULT false,
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- インデックス：未読件数カウント用
CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON public.notifications (user_id, is_read, created_at DESC);

-- RLS 有効化
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 自分宛ての通知だけ見れる
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ログインユーザーなら誰でも通知を挿入できる（自分への通知を除外するのはアプリ側で対応）
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 自分の通知だけ既読にできる
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 権限付与
GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
