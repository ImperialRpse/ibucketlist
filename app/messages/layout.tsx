'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const currentPath = usePathname();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dm_participants')
        .select(`
          room_id,
          dm_rooms!inner (
            last_message_content,
            last_message_at
          ),
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .neq('user_id', user.id)
        .order('last_message_at', { referencedTable: 'dm_rooms', ascending: false });

      if (error) {
        console.error("Fetch error:", error);
      } else {
        // 💡 Supabaseの型によって dm_rooms がオブジェクトか配列か変わるため、コンソールで確認
        console.log("取得データ:", data);
        setRooms(data || []);
      }
    };


    fetchRooms();

    // 2. 【重要】dm_rooms テーブルの変更をリアルタイム購読
    // メッセージが送られるとSQLトリガーによって dm_rooms が更新されるので、それを検知します
    const channel = supabase
      .channel('list_updates')
      .on('postgres_changes', {
        event: 'UPDATE', // SQLトリガーによる「更新」をキャッチ
        schema: 'public',
        table: 'dm_rooms'
      }, (payload) => {
        // 💡 どこかの部屋が更新されたら、一覧を再取得して並び替える
        // (もっとスマートな書き方もありますが、これが一番確実でバグが少ないです)
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#121212] text-white max-w-6xl mx-auto border-x border-gray-800 overflow-hidden">
      {/* 左側：スレッド一覧 */}
      <aside className="w-[350px] border-r border-gray-800 flex flex-col bg-[#1a1a1a]">
        <div className="p-5 border-b border-gray-800 bg-[#121212]">
          <h1 className="text-xl font-bold text-white tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
          {rooms.length === 0 ? (
            <p className="p-5 text-sm text-gray-500 text-center">No messages yet.</p>
          ) : (
            rooms.map((item) => {
              const isActive = currentPath.includes(item.room_id);
              return (
                <Link
                  key={item.room_id}
                  href={`/messages/${item.room_id}`}
                  className={`flex items-center gap-3 p-4 transition-colors border-b border-gray-800/50 last:border-b-0 ${isActive
                    ? 'bg-[#2a2a2a] border-l-4 border-l-blue-500'
                    : 'hover:bg-[#222222]'
                    }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-gray-700">
                    {/* アイコンを表示　なければ名前の頭文字*/}
                    {item.profiles?.avatar_url ? (
                      <img src={item.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                        {item.profiles?.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  {/* 名前と最新メッセージの表示*/}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="font-bold truncate text-gray-100">{item.profiles?.display_name}</div>
                      {/* 💡 送信時間を表示 */}
                      {item.dm_rooms?.last_message_at && (
                        <span className="text-[10px] text-gray-500">
                          {new Date(item.dm_rooms.last_message_at).toLocaleDateString() === new Date().toLocaleDateString()
                            ? new Date(item.dm_rooms.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(item.dm_rooms.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {/* 💡 最新メッセージのプレビュー */}
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.dm_rooms?.last_message_content || 'まだメッセージはありません'}
                    </p>
                  </div>

                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* 右側：コンテンツ表示エリア */}
      <main className="flex-1 flex flex-col bg-[#121212] overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}