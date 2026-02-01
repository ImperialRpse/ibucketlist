'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const router = useRouter();

  // 新規登録処理
  const handleSignUp = async () => {
    if (!displayName) {
      alert("ユーザー名を入力してください");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 💡 ここで user_metadata として保存するのがコツ！
        data: {
          display_name: displayName,
        },
      },
    });
    
    if (error) alert(error.message);
    else alert('確認メールを送信しました！メール内のリンクをクリックして登録を完了させてください。');
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
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-black border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Welcome!</h1>
      
      {/* 💡 追加：ユーザー名入力欄（新規登録時のみ使われます） */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">ユーザー名（新規作成時のみ）</label>
        <input
          type="text"
          placeholder="ニックネーム"
          className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-blue-500 outline-none transition-all"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">メールアドレス</label>
        <input
          type="email"
          placeholder="email@example.com"
          className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-blue-500 outline-none transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">パスワード</label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-blue-500 outline-none transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-4 rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all active:scale-95">
          ログイン
        </button>
        <button onClick={handleSignUp} className="w-full bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95">
          新規アカウント作成
        </button>
      </div>
    </div>
  );
}