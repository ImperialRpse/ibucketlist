'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'dm';
  is_read: boolean;
  created_at: string;
  item_id: string | null;
  actor: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

// 通知ごとのメッセージを返す
const notifLabel = (n: Notification): string => {
  const name = n.actor?.display_name || 'ユーザー';
  switch (n.type) {
    case 'like': return `${name} があなたの投稿にいいねしました`;
    case 'comment': return `${name} があなたの投稿にコメントしました`;
    case 'reply': return `${name} があなたのコメントに返信しました`;
    case 'follow': return `${name} があなたをフォローしました`;
    case 'dm': return `${name} からメッセージが届きました`;
    default: return '新しい通知があります';
  }
};

export default function Nav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  //notificationを格納する配列を定義
  const [notifications, setNotifications] = useState<Notification[]>([]);
  //useRefとは「画面には出さないけれど、プログラムの裏側でずっと覚えておきたい情報」を保存するのに適しています。
  //<div ref={notifRef}> で、その箱を実際のベルボタンの div と紐づける。
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchProfile = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', id)
      .single();
    if (data) setAvatarUrl(data.avatar_url);
  };

  // 通知を取得（最新20件）
  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select(`
        id, type, is_read, created_at, item_id,
        actor:actor_id ( display_name, avatar_url )
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      //any型をrowという名前で受け取る
      const normalized = data.map((row: any) => ({
        //スプレッド構文でrowの中身を展開、actorだけ加工して上書き
        ...row,
        actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor,
      }));
      setNotifications(normalized);
    }
  };

  // 通知を全既読にする
  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // ドロップダウン外クリックで閉じる
  //useEffectを使う理由
  //外の世界（document）を触るから。
  //部品が消える時に正しく「お掃除」したいから。
  //何度も同じ命令を繰り返さないように、実行回数をコントロールしたいから。
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      //notifRef.currentは要素が存在していたらtrue、存在しなかったらfalse
      //e.targetはクリックした要素
      //notifRef.current.contains(e.target as Node)はクリックした要素がnotifRef.currentに含まれていたらtrue、含まれていなかったらfalse
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    //ブラウザが表示しているページ全体に対してaddEventListenerでイベント（mousedownしたらhandlerを実行）を追加
    document.addEventListener('mousedown', handler);
    //useEffect は return を使うことで、その部品が画面から消える時に**「後片付けの命令」**を実行できます。
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let notifChannel: ReturnType<typeof supabase.channel> | null = null;

    //onAuthStateChange（session）: ブラウザに保存されている情報をパッと返すので速いですが、厳密な本人確認（偽造チェック）はしていません。
    //getUser(): サーバーに問い合わせるため、非常に安全です。
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserId(user.id);
        fetchProfile(user.id);
        fetchNotifications(user.id);

        // Realtime購読：通知テーブルへの新規INSERT
        notifChannel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => fetchNotifications(user.id)
          )
          .subscribe();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setUserId(null);
        setAvatarUrl(null);
        setNotifications([]);
        if (notifChannel) supabase.removeChannel(notifChannel);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (notifChannel) supabase.removeChannel(notifChannel);
    };
  }, []);

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
                className={`relative p-2 rounded-full transition-all hover:bg-gray-100 ${isNotifOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <span className="font-bold text-gray-800 text-sm">通知</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-500 hover:underline font-semibold"
                      >
                        すべて既読
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-10">通知はありません</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50'
                            }`}
                        >
                          {/* アクターのアバター */}
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                            {n.actor?.avatar_url ? (
                              <img src={n.actor.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              n.actor?.display_name?.[0]?.toUpperCase() || '?'
                            )}
                          </div>

                          {/* テキスト */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 leading-snug">
                              {notifLabel(n)}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(n.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* 未読ドット */}
                          {!n.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── メッセージアイコン ── */}
            <Link
              href="/messages"
              className={`p-2 rounded-full transition-all hover:bg-gray-100 ${pathname === '/messages' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
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