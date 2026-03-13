'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <nav className="flex justify-between items-center p-4 bg-transparent sticky top-0 z-40">
      <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
        BUCKET LIST
      </Link>

      <div className="flex items-center gap-4">
        {userId ? (
          <>
            {/* ── ベルアイコン（通知） ── */}
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
                {/* ベルSVG */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>

                {/* バッジ（未読数） */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-in zoom-in duration-200">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ── 通知ドロップダウン ── */}
              {isNotifOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  markAllRead={markAllRead}
                />
              )}
            </div>

            {/* ── メッセージアイコン ── */}
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

            {/* ── プロフィールへのリンク ── */}
            <Link href={`/profile/${userId}`}>
              <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform bg-gray-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{userEmail ? userEmail[0].toUpperCase() : 'U'}</span>
                )}
              </div>
            </Link>
          </>
        ) : (
          <Link href="/login" className="text-blue-500 font-bold hover:underline transition-all">
            ログイン
          </Link>
        )}
      </div>
    </nav>
  );
}