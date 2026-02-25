'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 💡 現在のページ判定用

export default function Nav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const pathname = usePathname(); // 💡 追加

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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserId(user.id);
        fetchProfile(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setUserId(null);
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-transparent sticky top-0 z-40">
      <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tighter">
        BUCKET LIST
      </Link>

      <div className="flex items-center gap-4"> {/* 💡 隙間を作るために gap-4 を追加 */}
        {userId ? (
          <>
            {/* 💡 メッセージ一覧への遷移ボタン */}
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

            {/* プロフィールへのリンク */}
            <Link href={`/profile/${userId}`}>
              <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform bg-gray-200">
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