'use client';
import { usePathname } from 'next/navigation';
import { useMessageRooms } from '@/hooks/useMessageRooms';
import { RoomListItem } from './components/RoomListItem';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { rooms } = useMessageRooms();
  const currentPath = usePathname();

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
            rooms.map((item) => (
              <RoomListItem 
                key={item.room_id} 
                item={item} 
                isActive={currentPath.includes(item.room_id)} 
              />
            ))
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