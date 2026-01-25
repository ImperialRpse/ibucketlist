'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Nav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null);
    });
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-white border-b sticky top-0 z-40">
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