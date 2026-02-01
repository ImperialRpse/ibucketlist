'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 初期読み込み: ユーザーIDの取得と投稿リストの取得
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchAllItems();
    };
    init();
  }, []);

  // 投稿リスト取得（いいねデータを含む）
  const fetchAllItems = async () => {
    const { data, error } = await supabase
      .from('bucket_items')
      .select(`
        *,
        profiles ( display_name ),
        likes ( user_id )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Error:", error.message);
    } else if (data) {
      setItems(data);
    }
  };

  // いいねの切り替え処理
  const toggleLike = async (itemId: string, isLikedByMe: boolean) => {
    if (!currentUserId) {
      alert("いいねするにはログインが必要です");
      return;
    }

    if (isLikedByMe) {
      // すでにいいね済みなら削除
      await supabase
        .from('likes')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', currentUserId);
    } else {
      // 未いいねなら追加
      await supabase
        .from('likes')
        .insert({ item_id: itemId, user_id: currentUserId });
    }

    // 状態を最新に更新
    await fetchAllItems();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Everyone's Bucket List</h1>
      
      <div className="grid gap-4">
        {items.map((item) => {
          // 自分がいいねしているか判定
          const isLikedByMe = item.likes?.some((like: any) => like.user_id === currentUserId);
          const likeCount = item.likes?.length || 0;

          return (
            <div key={item.id} className="p-6 border rounded-2xl shadow-sm bg-white text-black border-gray-200 transition-all">
              <p className="text-sm font-bold text-blue-600 mb-1">
                {item.profiles ? (
                  Array.isArray(item.profiles) 
                  ? item.profiles[0]?.display_name 
                  : item.profiles.display_name
                ) : '名無しのユーザー'}
              </p>
              
              <p className="text-lg font-semibold mb-4 text-gray-800">{item.title}</p>
              
              <div className="flex justify-between items-center border-t pt-4">
                {/* いいねボタンセクション */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleLike(item.id, isLikedByMe)}
                    className={`text-2xl transition-all duration-200 active:scale-150 ${
                      isLikedByMe ? 'text-pink-500' : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    {isLikedByMe ? '❤️' : '♡'}
                  </button>
                  <span className="font-bold text-gray-600">{likeCount}</span>
                </div>

                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <p className="text-center text-gray-500 mt-10">まだ投稿がありません。</p>
      )}
    </div>
  );
}