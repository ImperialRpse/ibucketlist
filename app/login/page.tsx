'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // 新規登録処理
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert('確認メールを送信しました！メール内のリンクをクリックしてください。');
  };

  // ログイン処理
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    else {
      alert('ログイン成功！');
      router.push('/'); // ログイン後にリスト画面へ移動
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>
      <input
        type="email"
        placeholder="メールアドレス"
        className="w-full p-2 mb-4 border rounded bg-white text-black"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード"
        className="w-full p-2 mb-6 border rounded bg-white text-black"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex flex-col gap-3">
        <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          ログイン
        </button>
        <button onClick={handleSignUp} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
          新規アカウント作成
        </button>
      </div>
    </div>
  );
}