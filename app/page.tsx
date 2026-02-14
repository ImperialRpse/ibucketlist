'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // コメントモーダル用のステート
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchAllItems();
    };
    init();
  }, []);

  // 投稿リスト取得（コメント数も含める）
  const fetchAllItems = async () => {
    const { data, error } = await supabase
      .from('bucket_items')
      .select(`
        *,
        profiles ( display_name ),
        likes ( user_id ),
        comments ( id ) 
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Error:", error.message);
    } else if (data) {
      setItems(data);
    }
  };

  // 特定の投稿のコメントを取得
  const fetchComments = async (itemId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles (
          display_name
        )
      `) // 💡 profiles(display_name) が正しく取得できているか確認
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });
  
    if (error) {
      console.error("コメント取得エラー:", error.message);
    } else {
      console.log("取得したコメント:", data); // デバッグ用にコンソールで確認
      setComments(data || []);
    }
  };


  // コメントを投稿
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId || !selectedItem) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        item_id: selectedItem.id,
        user_id: currentUserId,
        content: newComment
      });

    if (!error) {
      setNewComment('');
      fetchComments(selectedItem.id); // コメント一覧を更新
      fetchAllItems(); // タイムライン側のコメント数表示を更新
    }
  };

  // モーダルを開く
  const openCommentModal = (item: any) => {
    setSelectedItem(item);
    setIsCommentModalOpen(true);
    fetchComments(item.id);
  };

  const toggleLike = async (itemId: string, isLikedByMe: boolean) => {
    if (!currentUserId) return alert("ログインが必要です");
    if (isLikedByMe) {
      await supabase.from('likes').delete().eq('item_id', itemId).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ item_id: itemId, user_id: currentUserId });
    }
    await fetchAllItems();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Everyone's Bucket List</h1>

      <div className="grid gap-4">
        {items.map((item) => {
          const isLikedByMe = item.likes?.some((like: any) => like.user_id === currentUserId);
          const likeCount = item.likes?.length || 0;
          const commentCount = item.comments?.length || 0;

          return (
            <div key={item.id} className="p-6 border rounded-2xl shadow-sm bg-white text-black border-gray-200">
              <Link href={`/profile/${item.user_id}`}>
                <p className="text-sm font-bold text-blue-600 mb-1 hover:underline cursor-pointer">
                  {item.profiles?.display_name || '名無しのユーザー'}
                </p>
              </Link>
              <p className="text-lg font-semibold mb-4 text-gray-800">{item.title}</p>

              {item.is_completed && (
                <div className="mb-4 space-y-3">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-full h-96 object-contain rounded-2xl border border-gray-50" />
                  )}
                  {item.reflection && (
                    <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-2xl italic">“{item.reflection}”</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-6">
                  {/* いいね */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleLike(item.id, isLikedByMe)} className={`text-2xl transition-all active:scale-150 ${isLikedByMe ? 'text-pink-500' : 'text-gray-300'}`}>
                      {isLikedByMe ? '❤️' : '♡'}
                    </button>
                    <span className="font-bold text-gray-600 text-sm">{likeCount}</span>
                  </div>
                  
                  {/* 💡 コメントボタン */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openCommentModal(item)} className="text-2xl text-gray-300 hover:text-gray-400 transition-colors">
                      💬
                    </button>
                    <span className="font-bold text-gray-600 text-sm">{commentCount}</span>
                  </div>
                </div>

                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 💡 コメントポップアップ（モーダル） */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700 text-center flex-1">Comments</h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            {/* コメント一覧表示 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {comments.length === 0 ? (
                <p className="text-center text-gray-400 py-10">最初のコメントを書きましょう！</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex flex-col border-b border-gray-50 pb-2">
                    <span className="text-xs font-bold text-blue-600">{c.profiles?.display_name}</span>
                    <span className="text-sm text-gray-800">{c.content}</span>
                  </div>
                ))
              )}
            </div>

            {/* 入力エリア */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="コメントを入力..."
                  className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-black"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button onClick={handleAddComment} className="text-blue-500 font-bold px-2">送信</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}