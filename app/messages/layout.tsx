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

      // 1. 自分の参加情報を先に取得（自分の既読時間を全部屋分ストックする）
      const { data: myParticipations } = await supabase
        .from('dm_participants')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);

      if (!myParticipations || myParticipations.length === 0) {
        setRooms([]);
        return;
      }

      // 自分が参加している部屋のIDリストを作成
      //myParticipationsは配列でありその配列をmap()で処理して新しい配列を作成する
      const myRoomIds = myParticipations.map(p => p.room_id);
      //部屋IDごとの既読時間をマップ化
      const myReadStatus = Object.fromEntries(
        myParticipations.map(p => [p.room_id, p.last_read_at])
      );

      // 2. 相手の情報と部屋の情報を取得、すでに作成したmyRoomIdsを使って、相手のレコードを取得する
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
        .in('room_id', myRoomIds)
        .neq('user_id', user.id);

      if (error) {
        console.error(error);
      } else {
        // 3. データを加工：取得した相手の情報がメインのdataにそのチャットに対応する「自分の既読時間」を追加する
        const processedData = (data || []).map((item: any) => ({
          ...item,
          // 相手のレコードに自分のlast_read_atを追加
          my_last_read_at: myReadStatus[item.room_id]
        }));

        // 最新メッセージ順にソート
        const sortedData = processedData.sort((a: any, b: any) => {
          const roomA = Array.isArray(a.dm_rooms) ? a.dm_rooms[0] : a.dm_rooms;
          const roomB = Array.isArray(b.dm_rooms) ? b.dm_rooms[0] : b.dm_rooms;
          return new Date(roomB?.last_message_at || 0).getTime() - new Date(roomA?.last_message_at || 0).getTime();
        });

        setRooms(sortedData);
      }
    };

    fetchRooms();

    // 3. リアルタイム更新の設定(テーブルを監視し変化があればfetchRoomsを再実行)
    const channel = supabase
      .channel('list_updates_channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dm_rooms' }, () => fetchRooms())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dm_participants' }, () => fetchRooms())
      .subscribe();

    //画面が閉じられたときにチャンネルを削除
    return () => { supabase.removeChannel(channel); };
  }, []);
  // 最初の1回だけ実行


  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#121212] text-white max-w-6xl mx-auto border-x border-gray-800 overflow-hidden">
      {/* 左側：スレッド一覧 */}
      <aside className="w-[350px] border-r border-gray-800 flex flex-col bg-[#1a1a1a]">
        <div className="p-5 border-b border-gray-800 bg-[#121212]">
          <h1 className="text-xl font-bold text-white tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
          {/* すでにチャットが存在するかどうかを判定 */}

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

                      {/* 💡 未読バッジ（青い丸）の表示判定 */}
                      {(() => {
                        //isArrayを使って配列かどうかを判定->配列なら最初の要素をroomに代入orそのまま代入
                        const room = Array.isArray(item.dm_rooms) ? item.dm_rooms[0] : item.dm_rooms;
                        // 最新メッセージの時間 > 自分が最後に読んだ時間 なら未読
                        const isUnread =
                          room?.last_message_at &&
                          (!item.my_last_read_at || new Date(room.last_message_at) > new Date(item.my_last_read_at));

                        return isUnread ? (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        ) : null;
                      })()}

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
      </aside >

      {/* 右側：コンテンツ表示エリア */}
      < main className="flex-1 flex flex-col bg-[#121212] overflow-hidden relative" >
        {children}
      </main >
    </div >
  );
}