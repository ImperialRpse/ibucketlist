'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useNav } from '@/hooks/useNav';
import { NotificationDropdown } from '@/components/NotificationDropdown';

export default function Nav() {
  const {
    userEmail,
    userId,
    avatarUrl,
    notifications,
    isNotifOpen,
    setIsNotifOpen,
    notifRef,
    unreadCount,
    markAllRead
  } = useNav();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isChatRoom = pathname === '/messages' && searchParams?.has('id');

  // ログインしていない場合はシンプルな上部ヘッダー（セーフエリア対応）
  if (!userId) {
    return (
      <nav className="flex justify-between items-center p-4 bg-white border-b border-gray-100 sticky top-0 z-40 pt-[calc(env(safe-area-inset-top,0px)+16px)] text-black">
        <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
          iBucketList
        </Link>
        <Link href="/login" className="text-blue-500 font-bold hover:underline transition-all">
          Login
        </Link>
      </nav>
    );
  }

  // 個別のチャット画面の場合はNav全体（上部・下部メニュー）を非表示にする
  if (isChatRoom) {
    return null;
  }

  return (
    <>
      {/* ─── モバイル用上部ヘッダー (md未満で表示、セーフエリア上部対応) ─── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 shadow-sm text-black">
        <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
          iBucketList
        </Link>
        
        <div className="flex items-center gap-3">
          {/* 通知ベルアイコン */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                if (!isNotifOpen) markAllRead();
              }}
              className={`relative p-2 rounded-full transition-all hover:bg-gray-100 ${
                isNotifOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                markAllRead={markAllRead}
              />
            )}
          </div>
        </div>
      </header>

      {/* ─── モバイル用ボトムナビゲーション (TabBar) (md未満で表示、セーフエリア下部対応) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around items-center pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-lg text-black">
        {/* ホーム */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 transition-all ${
            pathname === '/' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        {/* 探す */}
        <Link
          href="/explore"
          className={`flex flex-col items-center gap-0.5 transition-all ${
            pathname === '/explore' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="text-[10px] font-bold">Explore</span>
        </Link>

        {/* メッセージ */}
        <Link
          href="/messages"
          className={`flex flex-col items-center gap-0.5 transition-all ${
            pathname?.startsWith('/messages') ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <span className="text-[10px] font-bold">Messages</span>
        </Link>

        {/* プロフィール */}
        <Link
          href={`/profile?id=${userId}`}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            pathname?.startsWith('/profile') && pathname !== '/profile/settings' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[8px] border overflow-hidden ${
            pathname?.startsWith('/profile') && pathname !== '/profile/settings' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-300'
          }`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>

      {/* ─── PC用上部ナビゲーションバー (md以上で表示) ─── */}
      <nav className="hidden md:flex justify-between items-center p-4 bg-transparent sticky top-0 z-40 text-black">
        <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
          iBucketList
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`p-2 rounded-full transition-all hover:bg-gray-100 ${
              pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                if (!isNotifOpen) markAllRead();
              }}
              className={`relative p-2 rounded-full transition-all hover:bg-gray-100 ${
                isNotifOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                markAllRead={markAllRead}
              />
            )}
          </div>

          <Link
            href="/explore"
            className={`p-2 rounded-full transition-all hover:bg-gray-100 ${
              pathname === '/explore' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </Link>

          <Link
            href="/messages"
            className={`p-2 rounded-full transition-all hover:bg-gray-100 ${
              pathname === '/messages' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </Link>

          <Link href={`/profile?id=${userId}`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform bg-gray-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{userEmail ? userEmail[0].toUpperCase() : 'U'}</span>
              )}
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}