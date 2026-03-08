-- =====================================================
-- コメントへの返信機能 追加マイグレーション
-- Supabase の SQL Editor で実行してください
-- =====================================================

-- 1. comments テーブルに parent_id カラムを追加
--    parent_id が NULL のものがトップレベルのコメント
--    parent_id が設定されているものが返信コメント
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. 返信一覧を取得しやすいようにインデックスを追加
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);

-- 3. RLS ポリシーは既存の以下がそのまま使えます（変更不要）
--    "Anyone can view comments" → SELECT は true
--    "Authenticated users can comment" → INSERT WITH CHECK (auth.uid() = user_id)
