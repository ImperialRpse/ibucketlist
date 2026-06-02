'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useMessageRooms } from '@/hooks/useMessageRooms';
import { RoomListItem } from './components/RoomListItem';

function RoomList() {
  const { rooms } = useMessageRooms();
  const searchParams = useSearchParams();
  const activeRoomId = searchParams.get('id');

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-500 text-2xl">💬</div>
        <p className="text-gray-500 text-sm">No messages yet.</p>
      </div>
    );
  }

  return (
    <>
      {rooms.map((item) => (
        <RoomListItem
          key={item.room_id}
          item={item}
          isActive={activeRoomId === item.room_id}
        />
      ))}
    </>
  );
}

function MessagesLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const activeRoomId = searchParams.get('id');

  return (
    <div
      className="flex bg-white text-black max-w-6xl mx-auto border-x border-gray-200 overflow-hidden"
      style={{
        height: '100dvh',
      }}
    >
      {/* 左側：スレッド一覧 — モバイルでは roomId が無い場合のみ全幅表示 */}
      <aside
        className={`
          border-r border-gray-200 flex flex-col bg-gray-50
          ${activeRoomId ? 'hidden md:flex md:w-[350px]' : 'flex w-full md:w-[350px]'}
        `}
      >
        <div className="p-5 border-b border-gray-200 bg-white pt-[calc(env(safe-area-inset-top,0px)+20px)] md:pt-5">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <Suspense fallback={<p className="p-5 text-sm text-gray-500 text-center">Loading rooms...</p>}>
            <RoomList />
          </Suspense>
        </div>
      </aside>

      {/* 右側：コンテンツ表示エリア — モバイルでは roomId がある場合のみ表示 */}
      <main
        className={`
          flex-1 flex flex-col bg-white overflow-hidden relative
          ${activeRoomId ? 'flex' : 'hidden md:flex'}
        `}
      >
        {children}
      </main>
    </div>
  );
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-600">Loading...</div>}>
      <MessagesLayoutContent>{children}</MessagesLayoutContent>
    </Suspense>
  );
}