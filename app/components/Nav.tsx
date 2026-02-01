'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Nav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // 1. 初回読み込み時のユーザーチェック
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });

    // 2. 💡 ログイン・ログアウトの「変化」をリアルタイムで監視する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserEmail(session.user.email ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
      }
    });

    // コンポーネントが消える時に監視を止める（お作法）
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-transparent sticky top-0 z-40">
      <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
        BUCKET LIST
      </Link>

      <div>
        {userEmail ? (
          <Link href="/profile">
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden">
              {userEmail[0].toUpperCase()}
            </div>
          </Link>
        ) : (
          <Link href="/login" className="text-blue-500 font-bold">ログイン</Link>
        )}
      </div>
    </nav>
  );
}