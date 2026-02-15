'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Nav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // 💡 アバターURL用のステート

  // プロフィール情報を取得する関数
  const fetchProfile = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', id)
      .single();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
    }
  };

  useEffect(() => {
    // 1. 初回読み込み時のユーザーチェック
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserId(user.id);
        fetchProfile(user.id); // 💡 プロフィール画像を取得
      }
    });

    // 2. ログイン状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        fetchProfile(session.user.id); // 💡 ログイン時にも取得
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setUserId(null);
        setAvatarUrl(null); // 💡 クリア
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-transparent sticky top-0 z-40">
      <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
        BUCKET LIST
      </Link>

      <div>
        {userId ? (
          <Link href={`/profile/${userId}`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform bg-gray-200">
              {/* 💡 avatarUrl があれば画像を表示、なければイニシャルを表示 */}
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userEmail ? userEmail[0].toUpperCase() : 'U'}</span>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/login" className="text-blue-500 font-bold hover:underline transition-all">
            ログイン
          </Link>
        )}
      </div>
    </nav>
  );
}