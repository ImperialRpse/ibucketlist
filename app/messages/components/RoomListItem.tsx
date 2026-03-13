import Link from 'next/link';
import { RoomListItemData } from '@/hooks/useMessageRooms';

interface RoomListItemProps {
  item: RoomListItemData;
  isActive: boolean;
}

export const RoomListItem = ({ item, isActive }: RoomListItemProps) => {
  // isArrayを使って配列かどうかを判定->配列なら最初の要素をroomに代入orそのまま代入
  const room = Array.isArray(item.dm_rooms) ? item.dm_rooms[0] : item.dm_rooms;
  
  // 最新メッセージの時間 > 自分が最後に読んだ時間 なら未読
  const isUnread =
    room?.last_message_at &&
    (!item.my_last_read_at || new Date(room.last_message_at) > new Date(item.my_last_read_at));

  return (
    <Link
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
          {isUnread ? (
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          ) : null}

          {/* 💡 送信時間を表示 */}
          {room?.last_message_at && (
            <span className="text-[10px] text-gray-500">
              {new Date(room.last_message_at).toLocaleDateString() === new Date().toLocaleDateString()
                ? new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(room.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {/* 💡 最新メッセージのプレビュー */}
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {room?.last_message_content || 'まだメッセージはありません'}
        </p>
      </div>
    </Link>
  );
};
