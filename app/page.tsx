'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { insertNotification } from '@/lib/notifications';

export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchAllItems();
    };
    init();
  }, []);

  const fetchAllItems = async () => {
    const { data, error } = await supabase
      .from('bucket_items')
      .select(`
        *,
        profiles ( display_name, avatar_url ),
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

  const toggleLike = async (e: React.MouseEvent, itemId: string, isLikedByMe: boolean) => {
    e.stopPropagation();
    if (!currentUserId) return alert("ログインが必要です");
    if (isLikedByMe) {
      await supabase.from('likes').delete().eq('item_id', itemId).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ item_id: itemId, user_id: currentUserId });
      //itemsの一つ一つの要素をiとしている
      const item = items.find((i) => i.id === itemId);
      if (item) await insertNotification(item.user_id, currentUserId, 'like', itemId);
    }
    await fetchAllItems();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Everyone's Bucket List</h1>

      <div className="grid gap-4">
        {items.map((item) => {
          //like: 配列の中の「一人ひとりのいいね情報」を仮に like と名付けています。
          //some() は、配列を最初からチェックしていき、一人でも条件に合う人（自分）が見つかった瞬間にチェックを打ち切って、すぐに true を返します。
          const isLikedByMe = item.likes?.some((like: any) => like.user_id === currentUserId);
          const likeCount = item.likes?.length || 0;
          const commentCount = item.comments?.length || 0;

          return (
            <div
              key={item.id}
              //divにクリックイベントを設定することで、divがクリックされたときに/item/${item.id}に遷移する
              onClick={() => router.push(`/item/${item.id}`)}
              className="p-6 border rounded-2xl shadow-sm bg-white text-black border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div onClick={(e) => e.stopPropagation()} className="w-fit">
                <Link href={`/profile/${item.user_id}`} className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    {item.profiles?.avatar_url ? (
                      <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">
                        {item.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">
                    {item.profiles?.display_name || '名無しのユーザー'}
                  </p>
                </Link>
              </div>

              <p className={`text-lg font-semibold ${item.description ? 'mb-2' : 'mb-4'} text-gray-800 mt-2`}>{item.title}</p>

              {item.description && (
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{item.description}</p>
              )}

              {item.is_completed && (
                <div className="mb-4 space-y-3">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-full h-96 object-contain rounded-2xl border border-gray-50" />
                  )}
                  {item.reflection && (
                    <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-2xl italic">"{item.reflection}"</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-6">
                  {/* いいね */}
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => toggleLike(e, item.id, isLikedByMe)} className={`text-2xl transition-all active:scale-150 ${isLikedByMe ? 'text-pink-500' : 'text-gray-300'} hover:text-pink-400`}>
                      {isLikedByMe ? '❤️' : '♡'}
                    </button>
                    <span className="font-bold text-gray-600 text-sm">{likeCount}</span>
                  </div>

                  {/* コメントボタン */}
                  <div className="flex items-center gap-1">
                    <button className="text-2xl text-gray-300 hover:text-gray-400 transition-colors">
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
    </div>
  );
}