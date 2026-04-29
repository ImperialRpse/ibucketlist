import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export const useAuthForm = () => {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    // メール確認が不要な場合（即時ログイン）はここでprofilesにupsert
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          display_name: displayName,
        });

      if (profileError) {
        console.error('プロフィール保存エラー:', profileError.message);
      }
    }

    alert('確認メールを送信しました！メール内のリンクをクリックして登録を完了させてください。');
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    displayName,
    setDisplayName,
    handleSignUp,
    handleLogin,
  };
};
