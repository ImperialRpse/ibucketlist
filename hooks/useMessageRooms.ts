import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface DMRoom {
  last_message_content: string | null;
  last_message_at: string | null;
}

export interface RoomListItemData {
  room_id: string;
  my_last_read_at: string | null;
  dm_rooms: DMRoom | DMRoom[]; // depending on how supabase join returns it, often an array or single obj depending on relationship
  profiles: Profile | null;
}

export const useMessageRooms = () => {
    const [rooms, setRooms] = useState<RoomListItemData[]>([]);
    
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
            const myRoomIds = myParticipations.map(p => p.room_id);
            //部屋IDごとの既読時間をマップ化
            const myReadStatus = Object.fromEntries(
              myParticipations.map(p => [p.room_id, p.last_read_at])
            );
      
            // 2. 相手の情報と部屋の情報を取得
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
              // 3. データを加工：取得した相手の情報に自分の既読時間を追加
              const processedData = (data || []).map((item: any) => ({
                ...item,
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

    return { rooms, setRooms };
}
